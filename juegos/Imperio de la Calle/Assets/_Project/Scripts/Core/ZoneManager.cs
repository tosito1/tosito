using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Gameplay.Combat;
using MafiaTycoon.UI;

namespace MafiaTycoon.Core
{
    public class ZoneManager : MonoBehaviour
    {
        public static ZoneManager Instance { get; private set; }
        public static event System.Action OnZoneConquered;
        public static event System.Action<string, ZoneStatus> OnZoneStatusChanged;

        [Header("Master Zone List")]
        public List<ZoneData> allZones;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            InvokeRepeating(nameof(CheckForUnlocks), 1f, 5f);
            InvokeRepeating(nameof(ProcessRandomInvasions), 10f, 30f); // Check for attacks every 30s
        }

        public void CheckForUnlocks()
        {
            if (GameManager.Instance == null) return;

            int playerLevel = GameManager.Instance.data.playerLevel;
            bool changed = false;

            foreach (var zone in allZones)
            {
                ZoneSaveData saveData = GetZoneSaveData(zone.zoneID);
                if (saveData.status == ZoneStatus.Locked && playerLevel >= zone.requiredLevel)
                {
                    saveData.status = ZoneStatus.Unlocked;
                    OnZoneStatusChanged?.Invoke(zone.zoneID, ZoneStatus.Unlocked);
                    changed = true;
                    Debug.Log($"<color=white>New Territory available: {zone.zoneName}!</color>");
                }
            }

            if (changed) RecalculateZoneIncome();
        }

        public bool AttemptAssault(string zoneID)
        {
            ZoneData zone = allZones.Find(z => z.zoneID == zoneID);
            if (zone == null) return false;

            ZoneSaveData saveData = GetZoneSaveData(zoneID);
            if (saveData.status != ZoneStatus.Unlocked) return false;

            if (GameManager.Instance.TrySpendMoney(zone.conquerCost))
            {
                // Instanciar / Iniciar modo Shooter aquí!
                if (MafiaTycoon.Gameplay.Shooter.ShooterManager.Instance != null)
                {
                    // Random number of enemies based on difficulty
                    int enemyCount = Random.Range(3, 7); 
                    
                    // Ocultar la UI Principal temporalmente
                    var canvas = GameObject.Find("UI_Canvas");
                    if (canvas != null) canvas.GetComponent<Canvas>().enabled = false;
                    
                    MafiaTycoon.Gameplay.Shooter.ShooterManager.Instance.StartCombat(zoneID, enemyCount);
                    return true;
                }
                else
                {
                    // Fallback si no está el ShooterManager, conquistar al instante
                    CompleteConquest(zoneID);
                    return true;
                }
            }

            return false;
        }

        public void CompleteConquest(string zoneID)
        {
            ZoneData zone = allZones.Find(z => z.zoneID == zoneID);
            if (zone == null) return;
            
            ZoneSaveData saveData = GetZoneSaveData(zoneID);
            saveData.status = ZoneStatus.Conquered;
            RecalculateZoneIncome();
            OnZoneConquered?.Invoke();
            OnZoneStatusChanged?.Invoke(zoneID, ZoneStatus.Conquered);
            GameManager.Instance.SaveGame();
            Debug.Log($"<color=orange>Territory Conquered: {zone.zoneName}!</color>");
        }

        // --- DEFENSE & INVASION LOGIC ---

        public bool AssignDefender(string zoneID, string characterID)
        {
            ZoneSaveData zoneSave = GetZoneSaveData(zoneID);
            if (zoneSave == null || zoneSave.status != ZoneStatus.Conquered) return false;

            if (!zoneSave.assignedDefenderIDs.Contains(characterID))
            {
                zoneSave.assignedDefenderIDs.Add(characterID);
                Debug.Log($"Character {characterID} assigned to defend {zoneID}");
                return true;
            }
            return false;
        }

        private float CalculateTotalDefense(ZoneData zone, ZoneSaveData saveData)
        {
            float total = zone.baseDefenseDifficulty;

            if (CrewManager.Instance != null)
            {
                foreach (var charID in saveData.assignedDefenderIDs)
                {
                    var instance = CrewManager.Instance.activeCrew.Find(c => c.config.characterID == charID);
                    if (instance != null)
                    {
                        total += instance.GetCurrentDefense();
                    }
                }
            }

            return total;
        }

        private void ProcessRandomInvasions()
        {
            foreach (var zone in allZones)
            {
                ZoneSaveData saveData = GetZoneSaveData(zone.zoneID);
                if (saveData.status != ZoneStatus.Conquered) continue;

                // Probability check
                if (Random.value < zone.attackFrequency)
                {
                    TriggerInvasion(zone, saveData);
                }
            }
        }

        public void TriggerInvasion(ZoneData zone, ZoneSaveData saveData)
        {
            Debug.Log($"<color=red>INVASION! Rival gang is attacking {zone.zoneName}!</color>");

            // 1. Prepare Teams
            List<CharacterInstance> playerTeam = new List<CharacterInstance>();
            foreach (var charID in saveData.assignedDefenderIDs)
            {
                var instance = CrewManager.Instance.activeCrew.Find(c => c.config.characterID == charID);
                if (instance != null) playerTeam.Add(instance);
            }

            // Fallback: If no defenders, take first 3 from crew (or just fail)
            if (playerTeam.Count == 0 && CrewManager.Instance.activeCrew.Count > 0)
            {
                playerTeam.Add(CrewManager.Instance.activeCrew[0]);
            }

            List<CharacterInstance> enemyTeam = GenerateEnemyTeam(zone);

            // 2. Simulate
            CombatResult result = CombatManager.Instance.SimulateBattle(playerTeam, enemyTeam);

            // 3. Trigger Visual UI
            if (CombatUIController.Instance != null)
            {
                CombatUIController.Instance.StartVisualCombat(playerTeam, enemyTeam, result);
            }

            // 4. Resolve State (already handled by CombatManager XP, but need to handle Zone control)
            if (!result.playerWon)
            {
                saveData.status = ZoneStatus.Unlocked;
                saveData.assignedDefenderIDs.Clear();
                RecalculateZoneIncome();
            }
            
            GameManager.Instance.SaveGame();
        }

        private List<CharacterInstance> GenerateEnemyTeam(ZoneData zone)
        {
            List<CharacterInstance> team = new List<CharacterInstance>();
            int count = Random.Range(2, 5);
            
            // Create a temporary "mob" config
            CharacterData mobTemplate = ScriptableObject.CreateInstance<CharacterData>();
            mobTemplate.characterName = "Matón Rival";
            mobTemplate.baseAttack = zone.baseDefenseDifficulty / 5f;
            mobTemplate.baseDefense = zone.baseDefenseDifficulty / 10f;
            mobTemplate.baseHealth = zone.baseDefenseDifficulty;

            for (int i = 0; i < count; i++)
            {
                CharacterSaveData mobSave = new CharacterSaveData("mob_" + i, 1);
                team.Add(new CharacterInstance(mobTemplate, mobSave));
            }

            return team;
        }

        public void RecalculateZoneIncome()
        {
            double totalBonus = 0;
            foreach (var zone in allZones)
            {
                ZoneSaveData saveData = GetZoneSaveData(zone.zoneID);
                if (saveData.status == ZoneStatus.Conquered)
                {
                    totalBonus += zone.passiveIncomeBonus;
                }
            }
            
            // In a better architecture, we'd have an event 'OnIncomeChanged'
            // For now, we'll assume GameManager/BusinessManager will use this or we update it here
            Debug.Log($"Total Territory Income: ${totalBonus}");
        }

        public ZoneSaveData GetZoneSaveData(string id)
        {
            if (GameManager.Instance == null) return null;
            var list = GameManager.Instance.data.zones;
            var found = list.Find(z => z.id == id);
            if (found == null)
            {
                found = new ZoneSaveData(id, ZoneStatus.Locked);
                list.Add(found);
            }
            return found;
        }
    }
}
