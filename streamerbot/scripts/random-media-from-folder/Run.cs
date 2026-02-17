using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

public class CPHInline
{
    public bool Execute()
    {
        // ─────────────────────────────
        // Get args, accepted %folderPath% - which dir to look in. %fileType% - video, text, music and image.
        // ─────────────────────────────
        if (!CPH.TryGetArg("folderPath", out string folderPath) || string.IsNullOrWhiteSpace(folderPath))
        {
            CPH.LogError("No folderPath provided.");
            return false;
        }

        if (!CPH.TryGetArg("fileType", out string fileType) || string.IsNullOrWhiteSpace(fileType))
        {
            CPH.LogError("No fileType provided. Expected: text, video, music, image.");
            return false;
        }

        // Clean inputs
        folderPath = folderPath.Replace("\"", "");
        fileType = fileType.Trim().ToLowerInvariant();

        // ─────────────────────────────
        // Resolve extensions by type
        // ─────────────────────────────
        string[] extensions = GetExtensionsForType(fileType);

        if (extensions == null || extensions.Length == 0)
        {
            CPH.LogError($"Unsupported fileType: {fileType}");
            return false;
        }

        // ─────────────────────────────
        // Pick random file
        // ─────────────────────────────
        string randomFilePath = GetRandomFileFromFolder(folderPath, extensions);

        if (string.IsNullOrEmpty(randomFilePath))
        {
            CPH.LogError($"No {fileType} files found in folder: {folderPath}");
            return false;
        }

        // Output
        CPH.SetArgument("randomFile", randomFilePath);
        CPH.LogInfo($"Random {fileType} selected: {randomFilePath}");

        return true;
    }

    // ─────────────────────────────
    // Extension mapping
    // ─────────────────────────────
    private string[] GetExtensionsForType(string fileType)
    {
        switch (fileType)
        {
            case "video":
                return new[] { ".avi", ".flv", ".gif", ".mkv", ".mov", ".mp4", ".ts", ".webm" };

            case "image":
                return new[] { ".png", ".jpg", ".jpeg", ".bmp", ".webp", ".gif" };

            case "music":
                return new[] { ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a" };

            case "text":
                return new[] { ".txt", ".md", ".json", ".csv" };

            default:
                return null;
        }
    }

    // ─────────────────────────────
    // Random picker
    // ─────────────────────────────
    private string GetRandomFileFromFolder(string folderPath, string[] extensions)
    {
        if (!Directory.Exists(folderPath))
            return null;

        var files = Directory.GetFiles(folderPath, "*.*", SearchOption.TopDirectoryOnly)
            .Where(f => extensions.Any(ext =>
                f.EndsWith(ext, StringComparison.OrdinalIgnoreCase)))
            .ToArray();

        if (files.Length == 0)
            return null;

        Random random = new Random();
        return files[random.Next(files.Length)];
    }
}
