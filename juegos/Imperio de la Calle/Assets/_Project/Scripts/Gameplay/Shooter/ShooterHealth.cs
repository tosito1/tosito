using UnityEngine;
using UnityEngine.Events;

namespace MafiaTycoon.Gameplay.Shooter
{
    public class ShooterHealth : MonoBehaviour
    {
        public int maxHealth = 100;
        public int currentHealth;
        public bool isPlayer = false;

        public UnityEvent onDeath;

        private void Start()
        {
            currentHealth = maxHealth;
        }

        public void TakeDamage(int damage)
        {
            if (currentHealth <= 0) return;

            currentHealth -= damage;
            
            // Visual feedback could go here (flash red)

            if (currentHealth <= 0)
            {
                Die();
            }
        }

        private void Die()
        {
            onDeath?.Invoke();
            
            if (!isPlayer)
            {
                Destroy(gameObject); // Enemies destroy themselves for now
            }
            else
            {
                // Player death is handled by ShooterManager
                gameObject.SetActive(false); 
            }
        }
    }
}
