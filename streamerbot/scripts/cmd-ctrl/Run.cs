using System;
using System.Collections.Generic;
using System.Linq;
using Streamer.bot.Plugin.Interface.Model;

public class CPHInline
{
    public bool Execute()
    {
        if (!CPH.TryGetArg("id", out string idRaw) ||
            !CPH.TryGetArg("type", out string typeRaw) ||
            !CPH.TryGetArg("enabled", out string enabledRaw))
        {
            CPH.LogWarn("[QuickToggle] Missing required args: id, type, enabled");
            return false;
        }

        string type = typeRaw?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(type))
        {
            CPH.LogWarn("[QuickToggle] type cannot be empty");
            return false;
        }

        if (!bool.TryParse(enabledRaw, out bool enabled))
        {
            CPH.LogWarn($"[QuickToggle] enabled must be true/false, got '{enabledRaw}'");
            return false;
        }

        // ── Split multiple IDs/names using || separator ───────────────────────────────
        var items = (idRaw ?? "")
            .Split(new string[] { "||" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        if (!items.Any())
        {
            CPH.LogWarn("[QuickToggle] No valid id(s)/name(s) provided");
            return false;
        }

        int successCount = 0;
        int failCount = 0;

        foreach (var item in items)
        {
            string current = item;
            bool isGuid = Guid.TryParse(current, out _);

            try
            {
                switch (type)
                {
                    case "reward":
                    case "rewards":
                    case "rwd":
                        if (enabled)
                            CPH.EnableReward(current);
                        else
                            CPH.DisableReward(current);
                        successCount++;
                        break;

                    case "command":
                    case "cmd":
                        ToggleCommandOrGroup(current, enabled);
                        successCount++;
                        break;

                    case "commandgroup":
                    case "cmdgroup":
                    case "group":
                        ToggleCommandGroup(current, enabled);
                        successCount++;
                        break;

                    case "timer":
                    case "timers":
                    case "timerid":
                    case "timername":
                        if (enabled)
                        {
                            if (isGuid)
                                CPH.EnableTimerById(current);
                            else
                                CPH.EnableTimer(current);
                        }
                        else
                        {
                            if (isGuid)
                                CPH.DisableTimerById(current);
                            else
                                CPH.DisableTimer(current);
                        }
                        successCount++;
                        break;

                    case "action":
                    case "actions":
                    case "actionid":
                    case "actionname":
                        if (enabled)
                        {
                            if (isGuid)
                                CPH.EnableActionById(current);
                            else
                                CPH.EnableAction(current);
                        }
                        else
                        {
                            if (isGuid)
                                CPH.DisableActionById(current);
                            else
                                CPH.DisableAction(current);
                        }
                        successCount++;
                        break;

                    default:
                        CPH.LogWarn($"[QuickToggle] Unknown type '{type}' — skipping '{current}'");
                        failCount++;
                        continue;
                }

                CPH.LogInfo($"[QuickToggle] {type.ToUpper()} '{current}' → {(enabled ? "ENABLED" : "DISABLED")}");
            }
            catch (Exception ex)
            {
                CPH.LogWarn($"[QuickToggle] Failed to toggle {type} '{current}': {ex.Message}");
                failCount++;
            }
        }

        CPH.LogInfo(
            $"[QuickToggle] Completed: {successCount} succeeded, {failCount} failed ({(enabled ? "enabled" : "disabled")})"
        );

        // Optional: expose summary (useful for chat responses / conditions)
        CPH.SetArgument("toggleSuccess", successCount);
        CPH.SetArgument("toggleFailed", failCount);
        CPH.SetArgument("toggleSummary", $"{successCount} ok / {failCount} failed");

        return successCount > 0;
    }

    // ─────────────────────────────────────────────
    // Command toggle with smart resolution
    // ─────────────────────────────────────────────
    private void ToggleCommandOrGroup(string idOrNameOrGroup, bool enabled)
    {
        if (Guid.TryParse(idOrNameOrGroup, out _))
        {
            if (enabled)
                CPH.EnableCommand(idOrNameOrGroup);
            else
                CPH.DisableCommand(idOrNameOrGroup);
            return;
        }

        var commands = CPH.GetCommands() ?? new List<CommandData>();
        int matchedCommands = 0;

        foreach (var cmd in commands)
        {
            if (cmd == null) continue;

            bool matchesName = !string.IsNullOrWhiteSpace(cmd.Name) &&
                               string.Equals(cmd.Name, idOrNameOrGroup, StringComparison.OrdinalIgnoreCase);

            bool matchesAlias = cmd.Commands != null &&
                                cmd.Commands.Any(c => !string.IsNullOrWhiteSpace(c) &&
                                                      string.Equals(c.Trim(), idOrNameOrGroup, StringComparison.OrdinalIgnoreCase));

            if (!matchesName && !matchesAlias) continue;

            string cmdId = cmd.Id != Guid.Empty ? cmd.Id.ToString() : idOrNameOrGroup;

            if (enabled)
                CPH.EnableCommand(cmdId);
            else
                CPH.DisableCommand(cmdId);

            matchedCommands++;
        }

        if (matchedCommands > 0)
        {
            CPH.LogInfo($"[QuickToggle] {(enabled ? "Enabled" : "Disabled")} {matchedCommands} command(s) matching '{idOrNameOrGroup}'");
            return;
        }

        // Fall back to group toggle if no direct match
        ToggleCommandGroup(idOrNameOrGroup, enabled);
    }

    // ─────────────────────────────────────────────
    // Command Group toggle
    // ─────────────────────────────────────────────
    private void ToggleCommandGroup(string groupName, bool enabled)
    {
        var commands = CPH.GetCommands() ?? new List<CommandData>();
        int changed = 0;
        int missingIds = 0;

        foreach (var cmd in commands)
        {
            if (cmd == null) continue;

            if (!string.Equals(cmd.Group, groupName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (cmd.Id == Guid.Empty)
            {
                missingIds++;
                continue;
            }

            string cmdId = cmd.Id.ToString();

            if (enabled)
                CPH.EnableCommand(cmdId);
            else
                CPH.DisableCommand(cmdId);

            changed++;
        }

        if (changed == 0)
        {
            CPH.LogWarn($"[QuickToggle] No commands found in group '{groupName}'");
        }
        else
        {
            CPH.LogInfo($"[QuickToggle] {(enabled ? "Enabled" : "Disabled")} {changed} command(s) in group '{groupName}'");
        }

        if (missingIds > 0)
        {
            CPH.LogWarn($"[QuickToggle] Skipped {missingIds} command(s) in group '{groupName}' due to missing IDs");
        }
    }
}
