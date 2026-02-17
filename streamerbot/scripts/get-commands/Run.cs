using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using Streamer.bot.Plugin.Interface.Model;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const int CHAT_LIMIT = 480;
    private const string DEFAULT_FILENAME = "commands.json";

    // 🔧 DEFAULT DISPLAY
    private const string DEFAULT_ICON = "📜";
    private const string DEFAULT_TITLE_SUFFIX = "Commands";

    public bool Execute()
    {
        CPH.TryGetArg("cmd", out string groupFilterRaw);
        CPH.TryGetArg("sd", out string showDisabledRaw);
        CPH.TryGetArg("desc", out string showDescRaw);
        CPH.TryGetArg("alias", out string showAliasesRaw);
        // New: optional permissions filter (e.g. "", "Mod", "Sub", "VIP")
        CPH.TryGetArg("permissions", out string permissionsRaw);
        CPH.TryGetArg("jsonPath", out string jsonPathRaw);

        string groupFilter = groupFilterRaw?.Trim();
        string jsonPath = jsonPathRaw?.Trim();

        if (string.IsNullOrWhiteSpace(groupFilter))
        {
            CPH.SendMessage("⚠️ No command category provided.");
            return false;
        }

        // ─────────────────────────────
        // JSON is required for title/icon (and descriptions when requested). Fail fast if missing.
        // ─────────────────────────────
        if (string.IsNullOrWhiteSpace(jsonPath))
        {
            CPH.SendMessage("⚠️ No jsonPath provided. Run the test (MakeJson) to create commands.json, then pass jsonPath when calling getCommands.");
            return false;
        }

        string resolvedJsonPath = jsonPath;
        if (!Path.HasExtension(resolvedJsonPath))
            resolvedJsonPath = Path.Combine(resolvedJsonPath, DEFAULT_FILENAME);

        if (!File.Exists(resolvedJsonPath))
        {
            CPH.SendMessage($"⚠️ JSON file not found: {resolvedJsonPath}. Run the test (MakeJson) to create it.");
            return false;
        }

        bool showDisabled = showDisabledRaw?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;
        bool showDesc = showDescRaw?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;
        bool showAliases = showAliasesRaw?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;

        // Blank / null permissionsRaw ⇒ viewer is a normal user: we will only show commands
        // that have no permissions set in the JSON (everyone can use them).
        // Non‑blank permissionsRaw ⇒ we will only show commands that *do* have a permissions
        // value in the JSON (e.g. Mod/Sub/VIP‑only lists).
        bool hasPermissionFilter = !string.IsNullOrWhiteSpace(permissionsRaw);

        // ─────────────────────────────
        // Load JSON metadata (icons & titles always, descriptions only if requested)
        // ─────────────────────────────
        Dictionary<string, Dictionary<string, string>> descriptions = null;
        // group -> (command -> permissions string)
        Dictionary<string, Dictionary<string, string>> commandPermissions =
            new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> groupIcons = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> groupTitles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        var root = JObject.Parse(File.ReadAllText(resolvedJsonPath));
        var groups = root["groups"] as JObject;

        // Resolve requested group to the exact key used in JSON (same keys MakeJson writes from GetCommands).
        // If the group exists in the JSON, we use that exact key for all matching and lookups.
        string resolvedGroup = groupFilter;
        if (groups != null)
        {
            foreach (var p in groups.Properties())
            {
                if (string.Equals(p.Name, groupFilter, StringComparison.OrdinalIgnoreCase))
                {
                    resolvedGroup = p.Name;
                    break;
                }
            }
        }

        if (groups != null)
        {
            foreach (var g in groups.Properties())
            {
                var groupName = g.Name;
                var groupObj = g.Value as JObject;

                if (groupObj == null) continue;

                // Icon & Title (load always if non-empty)
                var groupIcon = groupObj["icon"]?.ToString();
                var groupTitle = groupObj["title"]?.ToString();

                if (!string.IsNullOrWhiteSpace(groupIcon))
                    groupIcons[groupName] = groupIcon;

                if (!string.IsNullOrWhiteSpace(groupTitle))
                    groupTitles[groupName] = groupTitle;

                // Descriptions (only if showDesc = true)
                if (showDesc)
                {
                    var cmdDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    var cmds = groupObj["commands"] as JObject;

                    if (cmds != null)
                    {
                        foreach (var c in cmds.Properties())
                        {
                            var desc = c.Value?["description"]?.ToString();
                            if (!string.IsNullOrWhiteSpace(desc))
                                cmdDict[c.Name] = desc;
                        }
                    }

                    if (cmdDict.Count > 0)
                    {
                        if (descriptions == null)
                            descriptions = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
                        descriptions[groupName] = cmdDict;
                    }
                }

                // Permissions (always loaded so we can filter output)
                {
                    var permDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    var cmds = groupObj["commands"] as JObject;

                    if (cmds != null)
                    {
                        foreach (var c in cmds.Properties())
                        {
                            var perm = c.Value?["permissions"]?.ToString();
                            if (perm != null)
                                permDict[c.Name] = perm.Trim();
                        }
                    }

                    if (permDict.Count > 0)
                        commandPermissions[groupName] = permDict;
                }
            }
        }

        // Same source as MakeJson: GetCommands() is the list of (group, commands).
        var commands = CPH.GetCommands();
        var entries = new List<string>();
        var usedCommandNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var allCommandNamesInGroup = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int disabledInGroupCount = 0;

        foreach (var cd in commands)
        {
            if (!string.Equals(cd.Group, resolvedGroup, StringComparison.OrdinalIgnoreCase))
                continue;

            var cmdList = cd.Commands?
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .ToList();

            if (cmdList == null || cmdList.Count == 0)
                continue;

            string primary = cmdList[0];
            allCommandNamesInGroup.Add(primary);

            // ─────────────────────────────
            // Permissions filtering
            // ─────────────────────────────
            string cmdPermission = null;
            if (commandPermissions.TryGetValue(cd.Group, out var groupPerms) &&
                groupPerms.TryGetValue(primary, out var permValue))
            {
                cmdPermission = permValue;
            }

            // If no permissions argument was passed (normal users), only show commands
            // whose JSON permissions is blank / missing (everyone can use).
            if (!hasPermissionFilter)
            {
                if (!string.IsNullOrWhiteSpace(cmdPermission))
                    continue; // this command is restricted (Mod/Sub/VIP/etc.) → hide from normal list
            }
            // If a permissions argument *was* passed, only show commands that have some
            // permissions value in JSON (any non‑blank string). The actual value is for you
            // to document / organise (e.g. "Mod", "Sub", "VIP").
            else
            {
                if (string.IsNullOrWhiteSpace(cmdPermission))
                    continue; // everyone‑commands → not part of this restricted list
            }

            if (!showDisabled && !cd.Enabled)
            {
                disabledInGroupCount++;
                continue;
            }

            usedCommandNames.Add(primary);

            string label = showAliases && cmdList.Count > 1
                ? $"{primary} ({string.Join(" ", cmdList.Skip(1))})"
                : primary;

            if (showDesc && descriptions != null &&
                descriptions.TryGetValue(cd.Group, out var groupDesc) &&
                groupDesc.TryGetValue(primary, out var descText) &&
                !string.IsNullOrWhiteSpace(descText))
            {
                label += $" - {descText}";
            }

            if (!cd.Enabled)
                label += " [disabled]";

            entries.Add(label);
        }

        // ─────────────────────────────
        // Orphaned descriptions warning
        // ─────────────────────────────
        if (showDesc && descriptions != null && descriptions.TryGetValue(resolvedGroup, out var jsonGroupDesc))
        {
            var orphaned = jsonGroupDesc.Keys
                .Where(k => !allCommandNamesInGroup.Contains(k))
                .ToList();

            if (orphaned.Count > 0)
            {
                string warning = $"⚠️ {orphaned.Count} description{(orphaned.Count == 1 ? "" : "s")} in JSON with no matching command: {string.Join(", ", orphaned.Take(6))}";
                if (orphaned.Count > 6) warning += ", ...";
                CPH.SendMessage(warning);
            }
        }

        if (entries.Count == 0)
        {
            if (disabledInGroupCount > 0)
                CPH.SendMessage($"📭 All {disabledInGroupCount} command{(disabledInGroupCount == 1 ? "" : "s")} in **{resolvedGroup}** are disabled.");
            else
                CPH.SendMessage($"📭 No commands found for **{resolvedGroup}**.");
            return true;
        }

        // ─────────────────────────────
        // Chunking
        // ─────────────────────────────
        var chunks = new List<string>();
        string current = "";

        foreach (var entry in entries)
        {
            var next = string.IsNullOrEmpty(current) ? entry : current + " • " + entry;

            if (next.Length > CHAT_LIMIT)
            {
                chunks.Add(current);
                current = entry;
            }
            else
            {
                current = next;
            }
        }

        if (!string.IsNullOrEmpty(current))
            chunks.Add(current);

        // ─────────────────────────────
        // Header with JSON icon/title if available
        // ─────────────────────────────
        string iconOut = DEFAULT_ICON;
        string titleOut = $"{resolvedGroup} {DEFAULT_TITLE_SUFFIX}";

        if (groupIcons.TryGetValue(resolvedGroup, out var customIcon) && !string.IsNullOrWhiteSpace(customIcon))
            iconOut = customIcon;

        if (groupTitles.TryGetValue(resolvedGroup, out var customTitle) && !string.IsNullOrWhiteSpace(customTitle))
            titleOut = customTitle;

        for (int i = 0; i < chunks.Count; i++)
        {
            string header = i == 0
                ? $"{iconOut} **{titleOut}** ({entries.Count}): "
                : $"{iconOut} **{titleOut}** (continued): ";

            CPH.SendMessage(header + chunks[i]);
        }

        return true;
    }
}
