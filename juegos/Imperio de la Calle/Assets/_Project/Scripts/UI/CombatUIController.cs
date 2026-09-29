using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using System.Collections.Generic;
using MafiaTycoon.Core;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Gameplay.Combat;

namespace MafiaTycoon.UI
{
    public class CombatUIController : MonoBehaviour
    {
        public static CombatUIController Instance { get; private set; }

        [Header("UI Panels")]
        public GameObject combatPanel;
        public GameObject victoryPanel;
        public GameObject defeatPanel;

        [Header("Combatants Layout")]
        public Transform playerTeamParent;
        public Transform enemyTeamParent;
        public GameObject portraitPrefab;

        [Header("Feedback")]
        public TextMeshProUGUI roundText;
        public TextMeshProUGUI logText;

        [Header("Victory Settings")]
        public TextMeshProUGUI xpGainedText;

        private Dictionary<string, CombatPortrait> portraits = new Dictionary<string, CombatPortrait>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            combatPanel.SetActive(false);
            victoryPanel.SetActive(false);
            defeatPanel.SetActive(false);
        }

        public void StartVisualCombat(List<CharacterInstance> playerTeam, List<CharacterInstance> enemyTeam, CombatResult result)
        {
            combatPanel.SetActive(true);
            victoryPanel.SetActive(false);
            defeatPanel.SetActive(false);
            logText.text = "¡Preparaos para la lucha!";
            
            SetupPortraits(playerTeam, enemyTeam);
            
            StartCoroutine(PlayCombatSequence(result));
        }

        private void SetupPortraits(List<CharacterInstance> playerTeam, List<CharacterInstance> enemyTeam)
        {
            foreach (Transform child in playerTeamParent) Destroy(child.gameObject);
            foreach (Transform child in enemyTeamParent) Destroy(child.gameObject);
            portraits.Clear();

            foreach (var character in playerTeam)
            {
                CreatePortrait(character, playerTeamParent, true);
            }

            foreach (var character in enemyTeam)
            {
                CreatePortrait(character, enemyTeamParent, false);
            }
        }

        private void CreatePortrait(CharacterInstance character, Transform parent, bool isPlayer)
        {
            GameObject go = Instantiate(portraitPrefab, parent);
            CombatPortrait portrait = go.GetComponent<CombatPortrait>();
            portrait.Setup(character);
            
            // Map by characterID (assuming unique in a single battle)
            portraits[character.config.characterID] = portrait;
        }

        private IEnumerator PlayCombatSequence(CombatResult result)
        {
            yield return new WaitForSeconds(1f);

            int groupCount = 0;
            foreach (var action in result.log)
            {
                // Group actions by round-ish or just play them fast
                yield return ExecuteAction(action);
                
                groupCount++;
                if (groupCount % 3 == 0) yield return new WaitForSeconds(0.4f);
            }

            yield return new WaitForSeconds(1f);
            ShowEndScreen(result);
        }

        private IEnumerator ExecuteAction(CombatAction action)
        {
            if (portraits.ContainsKey(action.attackerId) && portraits.ContainsKey(action.targetId))
            {
                CombatPortrait attacker = portraits[action.attackerId];
                CombatPortrait target = portraits[action.targetId];

                logText.text = $"{attacker.characterName} ataca a {target.characterName} por {action.damageDealt:F0}!";
                
                // Visual Shakes
                attacker.TriggerAttackAnimation();
                target.TakeDamage(action.damageDealt);

                if (action.resultType == CombatResultType.Death)
                {
                    target.TriggerDeath();
                }

                yield return new WaitForSeconds(0.2f);
            }
        }

        private void ShowEndScreen(CombatResult result)
        {
            combatPanel.SetActive(false);
            if (result.playerWon)
            {
                victoryPanel.SetActive(true);
                xpGainedText.text = $"XP Ganada: +{result.totalXpGained}";
            }
            else
            {
                defeatPanel.SetActive(true);
            }
        }

        public void CloseCombat()
        {
            combatPanel.SetActive(false);
            victoryPanel.SetActive(false);
            defeatPanel.SetActive(false);
        }
    }
}
