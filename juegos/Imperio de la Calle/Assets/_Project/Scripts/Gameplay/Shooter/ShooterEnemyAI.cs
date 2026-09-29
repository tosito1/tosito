using UnityEngine;

namespace MafiaTycoon.Gameplay.Shooter
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class ShooterEnemyAI : MonoBehaviour
    {
        [Header("AI Settings")]
        public float speed = 3f;
        public float stopDistance = 4f;
        public float agroRange = 10f;

        [Header("Shooting")]
        public GameObject projectilePrefab;
        public Transform firePoint;
        public float fireRate = 1f;
        private float nextFireTime = 0f;

        private Transform target;
        private Rigidbody2D rb;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.freezeRotation = true;
        }

        private void Start()
        {
            // Busca al jugador inicial
            ShooterPlayerController player = Object.FindAnyObjectByType<ShooterPlayerController>();
            if (player != null)
            {
                target = player.transform;
            }
        }

        private void Update()
        {
            if (target == null) return;

            float distance = Vector2.Distance(rb.position, target.position);

            // Gira hacia el jugador si está en rango
            if (distance <= agroRange)
            {
                Vector2 lookDir = (Vector2)target.position - rb.position;
                float angle = Mathf.Atan2(lookDir.y, lookDir.x) * Mathf.Rad2Deg - 90f;
                rb.rotation = angle;

                // Disparar
                if (distance <= stopDistance + 1f && Time.time >= nextFireTime)
                {
                    Shoot();
                }
            }
        }

        private void FixedUpdate()
        {
            if (target == null) return;

            float distance = Vector2.Distance(rb.position, target.position);

            // Mover hacia el jugador si está entre agroRange y stopDistance
            if (distance <= agroRange && distance > stopDistance)
            {
                Vector2 direction = ((Vector2)target.position - rb.position).normalized;
                rb.MovePosition(rb.position + direction * speed * Time.fixedDeltaTime);
            }
        }

        private void Shoot()
        {
            nextFireTime = Time.time + fireRate;

            if (projectilePrefab != null && firePoint != null)
            {
                GameObject bullet = Instantiate(projectilePrefab, firePoint.position, firePoint.rotation);
                Projectile proj = bullet.GetComponent<Projectile>();
                if (proj != null)
                {
                    proj.isEnemyProjectile = true;
                }
            }
        }
    }
}
