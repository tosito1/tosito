using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Core;

namespace MafiaTycoon.Gameplay
{
    public class CrewManager : MonoBehaviour
    {
        public static CrewManager Instance { get; private set; }
        public static event System.Action OnCharacterRecruited;

        [Header("Master Character List")]
        public List<CharacterData> allCharacters; // Assign all possible SOs here later
        
        [Header("Runtime Crew")]
        public List<CharacterInstance> activeCrew = new List<CharacterInstance>();

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
            InitializeCrew();
        }

        private void InitializeCrew()
        {
            if (GameManager.Instance == null) return;

            activeCrew.Clear();
            var savedCrew = GameManager.Instance.data.crew;

            foreach (var saveData in savedCrew)
            {
                // Find matching SO
                CharacterData config = allCharacters.Find(c => c.characterID == saveData.id);
                if (config != null)
                {
                    activeCrew.Add(new CharacterInstance(config, saveData));
                }
            }

            Debug.Log($"Crew initialized with {activeCrew.Count} members.");
        }

        /// <summary>
        /// Recruits a new character to the gang.
        /// </summary>
        public void RecruitCharacter(CharacterData config)
        {
            if (GameManager.Instance == null) return;

            CharacterSaveData newMemberSave = new CharacterSaveData(config.characterID);
            GameManager.Instance.data.crew.Add(newMemberSave);
            
            activeCrew.Add(new CharacterInstance(config, newMemberSave));
            OnCharacterRecruited?.Invoke();
            GameManager.Instance.SaveGame();
            
            Debug.Log($"<color=green>New Recruits: {config.characterName} has joined the crew!</color>");
        }

        /// <summary>
        /// Calculates the total economic bonus from all crew members.
        /// </summary>
        public double GetTotalCrewEconomicBonus()
        {
            double totalBonus = 0;
            foreach (var member in activeCrew)
            {
                totalBonus += member.GetCurrentEconomicBonus();
            }
            return totalBonus;
        }
    }
}
