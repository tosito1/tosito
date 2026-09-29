using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;

namespace MafiaTycoon.Core
{
    public class BusinessManager : MonoBehaviour
    {
        public static BusinessManager Instance { get; private set; }

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
        /// Recalculates the total income per second from all businesses.
        /// This should be called whenever a business Level Up occurs.
        /// </summary>
        public void RecalculateTotalIncome()
        {
             // This logic has been moved to BusinessController.UpdateGlobalIncome for simplicity.
             // You can expand this here later if you want a more centralized event system.
        }

        /// <summary>
        /// Finds save data for a specific business ID.
        /// </summary>
        public BusinessSaveData GetBusinessSaveData(string id)
        {
            if (GameManager.Instance == null) return null;

            var list = GameManager.Instance.data.businesses;
            var found = list.Find(b => b.id == id);
            
            if (found == null)
            {
                found = new BusinessSaveData(id, 0);
                list.Add(found);
            }
            
            return found;
        }

        public void UpgradeBusiness(string businessID)
        {
            var controllers = Object.FindObjectsByType<Gameplay.BusinessController>(FindObjectsInactive.Exclude);
            var target = System.Array.Find(controllers, c => c.config.businessID == businessID);
            if (target != null)
            {
                target.Upgrade();
            }
        }
    }
}
