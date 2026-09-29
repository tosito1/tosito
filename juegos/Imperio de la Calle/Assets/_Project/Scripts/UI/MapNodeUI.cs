using UnityEngine;
using UnityEngine.UI;
using TMPro;
using MafiaTycoon.Data;
using MafiaTycoon.Core;

namespace MafiaTycoon.UI
{
    public class MapNodeUI : MonoBehaviour
    {
        [Header("Identity")]
        public string zoneID;
        public TextMeshProUGUI zoneNameText;

        [Header("Visual Elements")]
        public Image iconImage;
        public Image statusOverlay; // For fog or color highlight
        public GameObject crewIndicator; // Shows if a crew is assigned

        [Header("Colors")]
        public Color lockedColor = new Color(0.1f, 0.1f, 0.1f, 0.8f);
        public Color unlockedColor = new Color(1, 1, 1, 0.2f);
        public Color ownedColor = new Color(0.85f, 0.65f, 0.12f, 0.4f); // Mafia Gold

        private ZoneData config;

        private void Start()
        {
            Refresh();
            ZoneManager.OnZoneStatusChanged += HandleStatusChanged;
        }

        private void OnDestroy()
        {
            ZoneManager.OnZoneStatusChanged -= HandleStatusChanged;
        }

        public void Setup(ZoneData data)
        {
            config = data;
            zoneID = data.zoneID;
            if (zoneNameText != null) zoneNameText.text = data.zoneName;
            Refresh();
        }

        public void Refresh()
        {
            if (ZoneManager.Instance == null) return;

            ZoneSaveData saveData = ZoneManager.Instance.GetZoneSaveData(zoneID);
            if (saveData == null) return;

            UpdateVisuals(saveData.status);
            
            if (crewIndicator != null)
                crewIndicator.SetActive(saveData.assignedDefenderIDs.Count > 0);
        }

        private void HandleStatusChanged(string id, ZoneStatus status)
        {
            if (id == zoneID)
            {
                UpdateVisuals(status);
            }
        }

        private void UpdateVisuals(ZoneStatus status)
        {
            switch (status)
            {
                case ZoneStatus.Locked:
                    statusOverlay.color = lockedColor;
                    if (zoneNameText != null) zoneNameText.text = "???";
                    break;
                case ZoneStatus.Unlocked:
                    statusOverlay.color = unlockedColor;
                    if (zoneNameText != null) zoneNameText.text = config != null ? config.zoneName : "Zona Libre";
                    break;
                case ZoneStatus.Conquered:
                    statusOverlay.color = ownedColor;
                    if (zoneNameText != null) zoneNameText.text = config != null ? config.zoneName : "Tu Territorio";
                    break;
            }
        }

        public void OnClick()
        {
            // Trigger the detail panel (to be implemented)
            Debug.Log($"Clicked on Zone: {zoneID}");
            // TerritoryManagementPanel.Instance.Show(zoneID);
        }
    }
}
