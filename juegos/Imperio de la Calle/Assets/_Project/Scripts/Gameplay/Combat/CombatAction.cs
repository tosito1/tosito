using System;

namespace MafiaTycoon.Gameplay.Combat
{
    public enum CombatResultType { Hit, Dodge, Critical, Death }

    [Serializable]
    public class CombatAction
    {
        public string attackerId;
        public string targetId;
        public float damageDealt;
        public CombatResultType resultType;
        public bool isPlayerAttacker;

        public CombatAction(string attacker, string target, float damage, CombatResultType result, bool isPlayer)
        {
            attackerId = attacker;
            targetId = target;
            damageDealt = damage;
            resultType = result;
            isPlayerAttacker = isPlayer;
        }
    }

    [Serializable]
    public class CombatResult
    {
        public bool playerWon;
        public System.Collections.Generic.List<CombatAction> log;
        public int totalXpGained;

        public CombatResult()
        {
            log = new System.Collections.Generic.List<CombatAction>();
        }
    }
}
