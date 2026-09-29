using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Core;

namespace MafiaTycoon.UI
{
    public class BusinessUIList : MonoBehaviour
    {
        [Header("Settings")]
        public GameObject businessItemPrefab;
        public Transform contentParent;

        private List<BusinessUIItem> activeUIItems = new List<BusinessUIItem>();

        private void Start()
        {
            // Wait a frame to ensure BusinessManager has initialized controllers
            Invoke(nameof(PopulateList), 0.1f);
        }

        public void PopulateList()
        {
            if (BusinessManager.Instance == null) return;

            // Clear existing
            foreach (var item in activeUIItems) Destroy(item.gameObject);
            activeUIItems.Clear();

            // Create items for each business controller
            // Assuming BusinessManager has a public list of existing controllers
            BusinessController[] controllers = Object.FindObjectsByType<BusinessController>(FindObjectsInactive.Exclude);

            foreach (var controller in controllers)
            {
                CreateUIItem(controller);
            }
        }

        private void CreateUIItem(BusinessController controller)
        {
            GameObject go = Instantiate(businessItemPrefab, contentParent);
            BusinessUIItem uiItem = go.GetComponent<BusinessUIItem>();
            uiItem.Initialize(controller);
            activeUIItems.Add(uiItem);
        }
    }
}
