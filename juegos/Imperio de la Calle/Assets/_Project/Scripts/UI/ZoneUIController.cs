using UnityEngine;
using MafiaTycoon.Core;
using MafiaTycoon.Data;
using TMPro;
using UnityEngine.UI;

namespace MafiaTycoon.UI
{
    public class ZoneUIController : MonoBehaviour
    {
        [Header("UI References")]
        public GameObject zoneItemPrefab;
        public Transform contentParent;

        private void Start()
        {
            RefreshUI();
        }

        public void RefreshUI()
        {
            if (ZoneManager.Instance == null) return;

            foreach (Transform child in contentParent) Destroy(child.gameObject);

            foreach (var zone in ZoneManager.Instance.allZones)
            {
                ZoneSaveData saveData = ZoneManager.Instance.GetZoneSaveData(zone.zoneID);
                GameObject go = Instantiate(zoneItemPrefab, contentParent);
                
                ZoneUIItem item = go.GetComponent<ZoneUIItem>();
                if (item != null) item.Setup(zone, saveData);
            }
        }
    }

    public class ZoneUIItem : MonoBehaviour
    {
        public TextMeshProUGUI nameText;
        public TextMeshProUGUI statusText;
        public TextMeshProUGUI incomeBonusText;
        public Button actionButton;
        public TextMeshProUGUI actionButtonText;

        public void Setup(ZoneData zone, ZoneSaveData saveData)
        {
            nameText.text = zone.zoneName;
            incomeBonusText.text = $"+${zone.passiveIncomeBonus}/sec";
            
            switch (saveData.status)
            {
                case ZoneStatus.Locked:
                    statusText.text = $"Bloqueado (Nvl {zone.requiredLevel})";
                    actionButton.interactable = false;
                    actionButtonText.text = "Bloqueado";
                    break;
                case ZoneStatus.Unlocked:
                    statusText.text = "Disponible";
                    actionButton.interactable = GameManager.Instance.data.money >= zone.conquerCost;
                    actionButtonText.text = $"Asaltar (${zone.conquerCost:N0})";
                    actionButton.onClick.RemoveAllListeners();
                    actionButton.onClick.AddListener(() => {
                        if (ZoneManager.Instance.AttemptAssault(zone.zoneID)) Setup(zone, saveData);
                    });
                    break;
                case ZoneStatus.Conquered:

                    statusText.text = "<color=orange>BAJO CONTROL</color>";
                    actionButton.interactable = false;
                    actionButtonText.text = "Conquistado";
                    break;
            }
        }
    }
}
