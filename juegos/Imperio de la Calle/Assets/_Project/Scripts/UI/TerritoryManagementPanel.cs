using UnityEngine;
using UnityEngine.UI;
using TMPro;
using MafiaTycoon.Data;
using MafiaTycoon.Core;
using MafiaTycoon.Gameplay;
using System.Collections.Generic;

namespace MafiaTycoon.UI
{
    public class TerritoryManagementPanel : MonoBehaviour
    {
        public static TerritoryManagementPanel Instance { get; private set; }

        [Header("UI Panels")]
        public GameObject mainPanel;
        
        [Header("Info Display")]
        public TextMeshProUGUI titleText;
        public TextMeshProUGUI descriptionText;
        public TextMeshProUGUI statsText;

        [Header("Buttons")]
        public Button conquerButton;
        public Button assignCrewButton;
        public Button closeButton;

        private string currentZoneID;
        private ZoneData currentData;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            if (mainPanel != null) mainPanel.SetActive(false);
            
            if (closeButton != null) closeButton.onClick.AddListener(() => { if (mainPanel != null) mainPanel.SetActive(false); });
            if (conquerButton != null) conquerButton.onClick.AddListener(OnConquerClicked);
        }

        public void Show(string zoneID)
        {
            if (ZoneManager.Instance == null) return;
            
            currentZoneID = zoneID;
            currentData = ZoneManager.Instance.allZones.Find(z => z.zoneID == zoneID);
            
            if (currentData == null) return;

            if (mainPanel != null) mainPanel.SetActive(true);
            Refresh();
        }

        private void Refresh()
        {
            if (ZoneManager.Instance == null || string.IsNullOrEmpty(currentZoneID)) return;
            ZoneSaveData saveData = ZoneManager.Instance.GetZoneSaveData(currentZoneID);
            if (saveData == null) return;
            
            titleText.text = currentData.zoneName;
            descriptionText.text = currentData.description;
            
            bool isConquered = saveData.status == ZoneStatus.Conquered;
            
            statsText.text = $"Ingresos: ${currentData.passiveIncomeBonus}/s\n" +
                             $"Dificultad: {currentData.baseDefenseDifficulty}\n" +
                             $"Defensores: {saveData.assignedDefenderIDs.Count}";

            conquerButton.gameObject.SetActive(saveData.status == ZoneStatus.Unlocked);
            assignCrewButton.gameObject.SetActive(isConquered);
            
            if (conquerButton.gameObject.activeSelf)
            {
                conquerButton.GetComponentInChildren<TextMeshProUGUI>().text = $"Conquistar (${currentData.conquerCost:N0})";
            }
        }

        private void OnConquerClicked()
        {
            if (ZoneManager.Instance.AttemptAssault(currentZoneID))
            {
                Refresh();
                Debug.Log($"Zona {currentZoneID} conquistada!");
            }
        }
    }
}
