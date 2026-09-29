using UnityEngine;

namespace MafiaTycoon.Gameplay.Shooter
{
    public class Projectile : MonoBehaviour
    {
        public float speed = 20f;
        public int damage = 10;
        public float lifeTime = 2f;
        public bool isEnemyProjectile = false;

        private void Start()
        {
            Destroy(gameObject, lifeTime);
        }

        private void Update()
        {
            transform.Translate(Vector3.up * speed * Time.deltaTime);
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            // Simple generic hit logic using component instead of tag
            if (collision.GetComponent<ShooterObstacle>() != null)
            {
                if (GameJuice.Instance != null) GameJuice.Instance.SpawnHitParticle(transform.position, Color.gray);
                Destroy(gameObject);
                return;
            }

            ShooterHealth targetHealth = collision.GetComponent<ShooterHealth>();
            if (targetHealth != null)
            {
                if ((isEnemyProjectile && targetHealth.isPlayer) || (!isEnemyProjectile && !targetHealth.isPlayer))
                {
                    if (GameJuice.Instance != null) GameJuice.Instance.SpawnHitParticle(transform.position, Color.red);
                    targetHealth.TakeDamage(damage);
                    Destroy(gameObject); // Destroy bullet after dealing damage
                }
            }
        }
    }
}
