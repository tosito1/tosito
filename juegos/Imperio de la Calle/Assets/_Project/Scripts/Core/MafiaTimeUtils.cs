using System;
using UnityEngine;

namespace MafiaTycoon.Core
{
    public static class MafiaTimeUtils
    {
        public static double GetOfflineSeconds(string lastSaveTimeString)
        {
            if (string.IsNullOrEmpty(lastSaveTimeString)) return 0;

            try
            {
                DateTime lastSaveTime = DateTime.Parse(lastSaveTimeString).ToUniversalTime();
                DateTime currentTime = DateTime.UtcNow;

                TimeSpan difference = currentTime - lastSaveTime;
                double totalSeconds = difference.TotalSeconds;

                // Return 0 if the time difference is negative (user changed system time)
                return totalSeconds > 0 ? totalSeconds : 0;
            }
            catch (Exception e)
            {
                Debug.LogError($"Error parsing time: {e.Message}");
                return 0;
            }
        }
    }
}
