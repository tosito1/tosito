using UnityEngine;
using TMPro;
using MafiaTycoon.Core;

namespace MafiaTycoon.UI
{
    public class HUDController : MonoBehaviour
    {
        [Header("UI Elements")]
        public TextMeshProUGUI moneyText;
        public TextMeshProUGUI incomeText;
        public TextMeshProUGUI levelText;
        public TextMeshProUGUI reputationText;
        public UnityEngine.UI.Image xpBar;

        private void Update()
        {
            if (GameManager.Instance == null) return;

            var data = GameManager.Instance.data;

            if (moneyText != null)
                moneyText.text = FormatValue(data.money);

            if (incomeText != null)
                incomeText.text = $"+{FormatValue(GameManager.Instance.GetTotalIncomePerSecond())}/s";

            if (levelText != null)
                levelText.text = $"Nivel {data.playerLevel}";

            if (reputationText != null)
                reputationText.text = $"Rep: {data.reputation}";

            if (xpBar != null && PlayerLevelManager.Instance != null)
            {
                xpBar.fillAmount = PlayerLevelManager.Instance.GetExpProgress();
            }
        }

        public string FormatValue(double value)
        {
            if (value >= 1e12) return (value / 1e12).ToString("F2") + "T";
            if (value >= 1e9)  return (value / 1e9).ToString("F2") + "B";
            if (value >= 1e6)  return (value / 1e6).ToString("F2") + "M";
            if (value >= 1e3)  return (value / 1e3).ToString("F2") + "K";
            return value.ToString("F0");
        }
    }
}
