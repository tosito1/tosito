using UnityEngine;
using UnityEngine.UI;
using TMPro;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Core;

namespace MafiaTycoon.UI
{
    public class BusinessUIItem : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI nameText;
        public TextMeshProUGUI levelText;
        public TextMeshProUGUI incomeText;
        public Image progressBar;
        public Button upgradeButton;
        public TextMeshProUGUI upgradeCostText;
        public Button collectButton;

        private BusinessController targetController;

        public void Initialize(BusinessController controller)
        {
            targetController = controller;
            nameText.text = controller.config.businessName;
            
            upgradeButton.onClick.AddListener(OnUpgradeClicked);
            if (collectButton != null)
                collectButton.onClick.AddListener(OnCollectClicked);
        }

        private void Update()
        {
            if (targetController == null) return;

            // Update Level and Income
            levelText.text = $"Nvl: {targetController.saveData.level}";
            incomeText.text = $"${targetController.CalculateCurrentIncome():F1}";

            // Update Progress Bar
            if (progressBar != null)
                progressBar.fillAmount = targetController.NormalizedProgress;

            // Update Upgrade Cost
            double cost = targetController.CalculateUpgradeCost();
            upgradeCostText.text = $"${FormatCost(cost)}";
            
            // Dynamic Coloring
            bool canAfford = GameManager.Instance.data.money >= cost;
            upgradeCostText.color = canAfford ? Color.green : Color.red;
            
            // Disable button if not enough money
            upgradeButton.interactable = canAfford;

            // Manual Collection visibility
            if (collectButton != null)
            {
                bool canCollect = !targetController.config.autoByDefault && !targetController.saveData.hasManager && targetController.NormalizedProgress >= 1f;
                collectButton.gameObject.SetActive(canCollect);
            }
        }

        private void OnUpgradeClicked()
        {
            if (BusinessManager.Instance != null)
            {
                BusinessManager.Instance.UpgradeBusiness(targetController.config.businessID);
            }
        }

        private void OnCollectClicked()
        {
            targetController.ManualCollect();
        }

        private string FormatCost(double value)
        {
            // Simple formatting just for the cost
            if (value >= 1e6) return (value / 1e6).ToString("F1") + "M";
            if (value >= 1e3) return (value / 1e3).ToString("F1") + "K";
            return value.ToString("F0");
        }
    }
}
