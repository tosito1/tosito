using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;

namespace MafiaTycoon.Core
{
    public class ManagerManager : MonoBehaviour
    {
        public static ManagerManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        /// <summary>
        /// Logic to hire a manager for a specific business.
        /// </summary>
        public bool HireManager(BusinessController business, ManagerData managerData)
        {
            if (business == null || managerData == null) return false;

            // 1. Check if already has a manager
            if (business.IsAutomated && !business.config.autoByDefault)
            {
                Debug.LogWarning($"{business.config.businessName} already has a manager.");
                return false;
            }

            // 2. Try to spend money
            if (GameManager.Instance.TrySpendMoney(managerData.hireCost))
            {
                // 3. Assign
                business.AssignManager(managerData);
                return true;
            }

            return false;
        }
    }
}
