using UnityEngine;

namespace MafiaTycoon.Gameplay.Combat
{
    public class Combatant
    {
        public CharacterInstance Character { get; private set; }
        public float CurrentHP { get; private set; }
        public float MaxHP { get; private set; }
        public string Name => Character.config.characterName;

        public bool IsDead => CurrentHP <= 0;

        public Combatant(CharacterInstance character)
        {
            this.Character = character;
            this.MaxHP = character.GetMaxHealth();
            this.CurrentHP = this.MaxHP;
        }

        public void TakeDamage(float damage)
        {
            float finalDamage = Mathf.Max(1, damage);
            CurrentHP -= finalDamage;
            if (CurrentHP < 0) CurrentHP = 0;
            
            Debug.Log($"[Combat] {Name} received {finalDamage:F1} damage. HP: {CurrentHP:F1}/{MaxHP:F1}");
        }

        public float GetAttackPower() => Character.GetCurrentAttack();
        public float GetDefensePower() => Character.GetCurrentDefense();
    }
}
