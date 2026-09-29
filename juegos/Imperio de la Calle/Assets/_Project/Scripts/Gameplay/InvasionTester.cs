using UnityEngine;
using MafiaTycoon.Core;
using MafiaTycoon.Data;

namespace MafiaTycoon.Gameplay
{
    public class InvasionTester : MonoBehaviour
    {
        [Header("Settings")]
        public string zoneIDToAttack;

        [ContextMenu("Trigger Manual Attack")]
        public void TriggerAttack()
        {
            if (ZoneManager.Instance == null) return;

            ZoneData zone = ZoneManager.Instance.allZones.Find(z => z.zoneID == zoneIDToAttack);
            if (zone == null)
            {
                Debug.LogError($"Zone {zoneIDToAttack} not found!");
                return;
            }

            ZoneSaveData saveData = ZoneManager.Instance.GetZoneSaveData(zoneIDToAttack);
            if (saveData.status != ZoneStatus.Conquered)
            {
                Debug.LogWarning($"Zone {zoneIDToAttack} is not conquered. Cannot attack.");
                return;
            }

            ZoneManager.Instance.TriggerInvasion(zone, saveData);
        }

        [ContextMenu("Check Total Defense")]
        public void LogDefense()
        {
            if (ZoneManager.Instance == null) return;

            foreach (var zone in ZoneManager.Instance.allZones)
            {
                ZoneSaveData saveData = ZoneManager.Instance.GetZoneSaveData(zone.zoneID);
                if (saveData.status == ZoneStatus.Conquered)
                {
                    // Accessing private method via calculation (or we can make it public)
                    // For now, let's just log names
                    Debug.Log($"Zone: {zone.zoneName} - Defenders: {saveData.assignedDefenderIDs.Count}");
                }
            }
        }
    }
}
