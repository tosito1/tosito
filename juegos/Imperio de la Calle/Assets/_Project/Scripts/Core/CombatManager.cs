using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Gameplay.Combat;
using System.Linq;

namespace MafiaTycoon.Core
{
    public class CombatManager : MonoBehaviour
    {
        public static CombatManager Instance { get; private set; }

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
        /// Simulates a battle between two teams and generates a result log.
        /// </summary>
        public CombatResult SimulateBattle(List<CharacterInstance> playerTeam, List<CharacterInstance> enemyTeam)
        {
            CombatResult result = new CombatResult();
            List<Combatant> teamA = playerTeam.Select(c => new Combatant(c)).ToList();
            List<Combatant> teamB = enemyTeam.Select(c => new Combatant(c)).ToList();

            int round = 1;
            
            while (IsTeamAlive(teamA) && IsTeamAlive(teamB))
            {
                // Team A attacks Team B
                ProcessTeamTurn(teamA, teamB, result, true);
                
                // Team B attacks Team A (if still alive)
                if (IsTeamAlive(teamB))
                {
                    ProcessTeamTurn(teamB, teamA, result, false);
                }

                round++;
                if (round > 50) break;
            }

            result.playerWon = IsTeamAlive(teamA);
            
            // Grant XP if victorious
            if (result.playerWon)
            {
                result.totalXpGained = 50 + (round * 5); // Example scaling
                foreach (var character in playerTeam)
                {
                    character.AddExperience(result.totalXpGained);
                }
            }

            return result;
        }

        private void ProcessTeamTurn(List<Combatant> attackers, List<Combatant> defenders, CombatResult resultLog, bool isPlayerAttacking)
        {
            foreach (var attacker in attackers)
            {
                if (attacker.IsDead) continue;

                var targets = defenders.Where(d => !d.IsDead).ToList();
                if (targets.Count == 0) break;

                var target = targets[Random.Range(0, targets.Count)];
                
                // Calculate Damage: Attack - half Defense
                float damage = attacker.GetAttackPower() - (target.GetDefensePower() * 0.5f);
                float finalDamage = Mathf.Max(1, damage);
                
                target.TakeDamage(finalDamage);

                // Add to Log
                resultLog.log.Add(new CombatAction(
                    attacker.Character.config.characterID, 
                    target.Character.config.characterID, 
                    finalDamage, 
                    target.IsDead ? CombatResultType.Death : CombatResultType.Hit, 
                    isPlayerAttacking
                ));
            }
        }

        private bool IsTeamAlive(List<Combatant> team)
        {
            return team.Any(c => !c.IsDead);
        }
    }
}
