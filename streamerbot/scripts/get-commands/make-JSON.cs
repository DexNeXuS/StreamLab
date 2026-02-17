using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string DEFAULT_FILENAME = "commands.json";

    public bool Execute()
    {
        CPH.TryGetArg("jsonPath", out string jsonPath);
        CPH.TryGetArg("sendToChat", out string sendToChatRaw);

        bool sendToChat = sendToChatRaw?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;

        if (string.IsNullOrWhiteSpace(jsonPath))
        {
            CPH.SendMessage("⚠️ No JSON path specified. Export aborted.");
            return false;
        }

        // ─────────────────────────────
        // Resolve path
        // ─────────────────────────────
        string finalPath = jsonPath;
        if (!Path.HasExtension(finalPath))
            finalPath = Path.Combine(finalPath, DEFAULT_FILENAME);

        Directory.CreateDirectory(Path.GetDirectoryName(finalPath));

        // ─────────────────────────────
        // Load existing JSON if present (merge mode: preserve icon/title/description)
        // ─────────────────────────────
        var existingByGroup = new Dictionary<string, JObject>(StringComparer.OrdinalIgnoreCase);
        if (File.Exists(finalPath))
        {
            try
            {
                var existing = JObject.Parse(File.ReadAllText(finalPath));
                var groupsNode = existing["groups"] as JObject;
                if (groupsNode != null)
                {
                    foreach (var p in groupsNode.Properties())
                        existingByGroup[p.Name] = p.Value as JObject;
                }
            }
            catch
            {
                existingByGroup.Clear();
            }
        }

        // ─────────────────────────────
        // Fetch current commands (source of truth for what exists)
        // ─────────────────────────────
        var commands = CPH.GetCommands();
        var groups = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

        foreach (var cmd in commands)
        {
            if (string.IsNullOrWhiteSpace(cmd.Group))
                continue;

            string primary = null;
            if (cmd.Commands != null)
            {
                foreach (var c in cmd.Commands)
                {
                    if (!string.IsNullOrWhiteSpace(c))
                    {
                        primary = c.Trim();
                        break;
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(primary))
                continue;

            // Resolve existing group (case-insensitive key match)
            JObject exGroup = null;
            foreach (var k in existingByGroup.Keys)
            {
                if (string.Equals(k, cmd.Group, StringComparison.OrdinalIgnoreCase))
                {
                    exGroup = existingByGroup[k];
                    break;
                }
            }

            string icon = exGroup?["icon"]?.ToString() ?? "";
            string title = exGroup?["title"]?.ToString() ?? "";

            // Resolve existing description & permissions for this command (case-insensitive)
            string description = "";
            string permissions = "";
            var exCommands = exGroup?["commands"] as JObject;
            if (exCommands != null)
            {
                var exProp = exCommands.Properties()
                    .FirstOrDefault(p => string.Equals(p.Name, primary, StringComparison.OrdinalIgnoreCase));

                if (exProp != null)
                {
                    description = exProp.Value?["description"]?.ToString() ?? "";
                    // New field for command visibility (e.g. "", "Mod", "Sub", "VIP")
                    permissions = exProp.Value?["permissions"]?.ToString() ?? "";
                }
            }

            // Create group if missing (only groups that exist in GetCommands get written)
            if (!groups.ContainsKey(cmd.Group))
            {
                groups[cmd.Group] = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase)
                {
                    { "icon", icon },
                    { "title", title },
                    { "commands", new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase) }
                };
            }

            var groupObj = (Dictionary<string, object>)groups[cmd.Group];
            var commandDict = (Dictionary<string, object>)groupObj["commands"];

            commandDict[primary] = new Dictionary<string, object>
            {
                { "description", description },
                // Empty string means "everyone can use this"
                { "permissions", permissions }
            };
        }

        // ─────────────────────────────
        // Build export (no longer contains deleted groups/commands)
        // ─────────────────────────────
        var export = new Dictionary<string, object>
        {
            { "generatedAt", DateTime.UtcNow.ToString("o") },
            { "groups", groups }
        };

        var json = JsonConvert.SerializeObject(export, Formatting.Indented);
        File.WriteAllText(finalPath, json);

        if (sendToChat)
        {
            CPH.SendMessage($"✅ Command JSON updated → {finalPath}");
        }

        return true;
    }
}
