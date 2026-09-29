using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;

namespace MafiaTycoon.Core
{
    public class InventoryManager : MonoBehaviour
    {
        public static InventoryManager Instance { get; private set; }

        [Header("Item Library")]
        public List<ItemData> allItemConfigs; // Assign all possible SOs here

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void AddItem(string itemID)
        {
            if (GameManager.Instance == null) return;
            
            ItemData config = allItemConfigs.Find(i => i.itemID == itemID);
            if (config != null)
            {
                GameManager.Instance.data.inventory.Add(new ItemSaveData(itemID));
                Debug.Log($"<color=green>Item Added: {config.itemName}</color>");
            }
        }

        public float GetAttackBonus(List<string> instanceIDs)
        {
            float total = 0;
            foreach (var id in instanceIDs)
            {
                ItemData config = GetConfigFromInstanceID(id);
                if (config != null) total += config.attackBonus;
            }
            return total;
        }

        public float GetDefenseBonus(List<string> instanceIDs)
        {
            float total = 0;
            foreach (var id in instanceIDs)
            {
                ItemData config = GetConfigFromInstanceID(id);
                if (config != null) total += config.defenseBonus;
            }
            return total;
        }

        public double GetEconomicBonus(List<string> instanceIDs)
        {
            double total = 0;
            foreach (var id in instanceIDs)
            {
                ItemData config = GetConfigFromInstanceID(id);
                if (config != null) total += config.economicBonus;
            }
            return total;
        }

        private ItemData GetConfigFromInstanceID(string instanceID)
        {
            if (GameManager.Instance == null) return null;

            ItemSaveData saveData = GameManager.Instance.data.inventory.Find(i => i.instanceID == instanceID);
            if (saveData != null)
            {
                return allItemConfigs.Find(c => c.itemID == saveData.itemID);
            }
            return null;
        }
    }
}
