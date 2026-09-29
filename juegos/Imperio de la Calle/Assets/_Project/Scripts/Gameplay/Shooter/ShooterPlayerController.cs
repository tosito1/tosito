using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace MafiaTycoon.Gameplay.Shooter
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class ShooterPlayerController : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 5f;
        private Rigidbody2D rb;
        private Vector2 movement;
        private Vector2 mousePos;

        [Header("Shooting")]
        public GameObject projectilePrefab;
        public Transform firePoint;
        public float fireRate = 0.2f;
        private float nextFireTime = 0f;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            // Configurar Rigidbody for TopDown
            rb.gravityScale = 0f;
            rb.freezeRotation = true;
        }

        private void Update()
        {
            HandleInput();
        }

        private void HandleInput()
        {
#if ENABLE_INPUT_SYSTEM
            // Nuevo Input System
            var keyboard = Keyboard.current;
            var mouse = Mouse.current;

            if (keyboard != null)
            {
                movement.x = (keyboard.dKey.isPressed ? 1f : 0f) - (keyboard.aKey.isPressed ? 1f : 0f);
                movement.y = (keyboard.wKey.isPressed ? 1f : 0f) - (keyboard.sKey.isPressed ? 1f : 0f);
            }

            if (mouse != null && Camera.main != null)
            {
                mousePos = Camera.main.ScreenToWorldPoint(mouse.position.ReadValue());
                
                if (mouse.leftButton.isPressed && Time.time >= nextFireTime)
                {
                    Shoot();
                }
            }
#else
            // Antiguo Input Manager (Por si vuelves atrás en la configuración)
            movement.x = Input.GetAxisRaw("Horizontal");
            movement.y = Input.GetAxisRaw("Vertical");

            if (Camera.main != null)
            {
                mousePos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
            }

            if (Input.GetButton("Fire1") && Time.time >= nextFireTime)
            {
                Shoot();
            }
#endif
        }

        private void FixedUpdate()
        {
            // Movimiento físico
            if (movement.sqrMagnitude > 0.01f)
            {
                rb.MovePosition(rb.position + movement.normalized * moveSpeed * Time.fixedDeltaTime);
            }

            // Rotar hacia el ratón
            Vector2 lookDir = mousePos - rb.position;
            float angle = Mathf.Atan2(lookDir.y, lookDir.x) * Mathf.Rad2Deg - 90f; 
            rb.rotation = angle;
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
                    proj.isEnemyProjectile = false;
                }

                // Generar impacto visual (Screen Shake y disparo)
                if (GameJuice.Instance != null)
                {
                    GameJuice.Instance.SpawnMuzzleFlash(firePoint);
                    GameJuice.Instance.TriggerScreenShake(0.1f, 0.15f);
                }
            }
        }
    }
}
