using System.IO;
using UnityEngine;
using MafiaTycoon.Data;

namespace MafiaTycoon.Core
{
    public static class SaveManager
    {
        private static string SavePath => Path.Combine(Application.persistentDataPath, "mafia_save.json");

        public static void Save(PlayerData data)
        {
            try
            {
                // Create backup of current save if it exists
                if (File.Exists(SavePath))
                {
                    string backupPath = SavePath + ".bak";
                    File.Copy(SavePath, backupPath, true);
                }

                data.lastSaveTime = System.DateTime.UtcNow.ToString("o");
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SavePath, json);
                Debug.Log($"<color=green>Game Saved successfully to: {SavePath}</color>");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to save game: {e.Message}");
            }
        }

        public static PlayerData Load()
        {
            if (!File.Exists(SavePath))
            {
                Debug.Log("No save file found. Creating new data.");
                return new PlayerData();
            }

            try
            {
                string json = File.ReadAllText(SavePath);
                PlayerData data = JsonUtility.FromJson<PlayerData>(json);
                Debug.Log("<color=cyan>Game Loaded successfully.</color>");
                return data;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load game: {e.Message}. Starting fresh.");
                return new PlayerData();
            }
        }

        public static void DeleteSave()
        {
            if (File.Exists(SavePath))
            {
                File.Delete(SavePath);
                Debug.Log("Save file deleted.");
            }
        }
    }
}
