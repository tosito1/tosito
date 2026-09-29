using UnityEngine;
using MafiaTycoon.Core;

namespace MafiaTycoon.Gameplay
{
    /// <summary>
    /// Simple script to test the economy system from the Inspector.
    /// Attach this to any GameObject in the scene.
    /// </summary>
    public class EconomyTester : MonoBehaviour
    {
        [Header("Testing Controls")]
        public double incomeToAdd = 10.0;
        public double amountToSpend = 100.0;

        [ContextMenu("Increase Income")]
        public void IncreaseIncome()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.data.incomePerSecond += incomeToAdd;
                Debug.Log($"Income increased by {incomeToAdd}. New Income: {GameManager.Instance.data.incomePerSecond}/s");
            }
        }

        [ContextMenu("Try Spend Money")]
        public void SpendMoney()
        {
            if (GameManager.Instance != null)
            {
                bool success = GameManager.Instance.TrySpendMoney(amountToSpend);
                if (success)
                {
                    Debug.Log($"Successfully spent ${amountToSpend}. New Balance: ${GameManager.Instance.data.money:N2}");
                }
                else
                {
                    Debug.LogWarning("Failed to spend money: Insufficient funds!");
                }
            }
        }

        [ContextMenu("Manual Save")]
        public void ManualSave()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SaveGame();
            }
        }
    }
}
