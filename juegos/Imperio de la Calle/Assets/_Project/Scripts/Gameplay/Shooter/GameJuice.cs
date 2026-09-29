using UnityEngine;

namespace MafiaTycoon.Gameplay.Shooter
{
    public class GameJuice : MonoBehaviour
    {
        public static GameJuice Instance;

        private float shakeDuration = 0f;
        private float shakeMagnitude = 0.1f;
        private Vector3 initialCamPos;
        private Camera mainCam;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            mainCam = Camera.main;
        }

        private void Update()
        {
            if (shakeDuration > 0 && mainCam != null)
            {
                // Solo alterar la posición local si estamos usando CameraController
                mainCam.transform.localPosition = (Vector3)Random.insideUnitCircle * shakeMagnitude;
                shakeDuration -= Time.deltaTime;
            }
            else if (mainCam != null)
            {
                shakeDuration = 0f;
                // Restablecer posición local (CameraController mueve el objeto padre o actualiza transform position)
                mainCam.transform.localPosition = Vector3.Lerp(mainCam.transform.localPosition, Vector3.zero, Time.deltaTime * 5f);
            }
        }

        public void TriggerScreenShake(float duration, float magnitude)
        {
            shakeDuration = duration;
            shakeMagnitude = magnitude;
        }

        public void SpawnHitParticle(Vector2 position, Color color)
        {
            GameObject spark = new GameObject("HitSpark");
            spark.transform.position = position;
            ParticleSystem ps = spark.AddComponent<ParticleSystem>();
            
            var main = ps.main;
            main.duration = 0.2f;
            main.startLifetime = 0.2f;
            main.startSpeed = new ParticleSystem.MinMaxCurve(5f, 15f);
            main.startSize = 0.15f;
            main.startColor = color;
            main.loop = false;
            main.playOnAwake = true;

            var emission = ps.emission;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 10, 20) });

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.1f;

            var renderer = ps.GetComponent<ParticleSystemRenderer>();
            renderer.material = new Material(Shader.Find("Sprites/Default")); // Standard lit/unlit sprite shader
            
            Destroy(spark, 1f);
        }

        public void SpawnMuzzleFlash(Transform firePoint)
        {
            GameObject flash = new GameObject("MuzzleFlash");
            flash.transform.position = firePoint.position;
            flash.transform.parent = firePoint;
            flash.transform.localRotation = Quaternion.identity;

            ParticleSystem ps = flash.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.duration = 0.1f;
            main.startLifetime = 0.05f;
            main.startSpeed = 10f;
            main.startSize = 0.3f;
            // Neón amarillo/naranja
            main.startColor = new Color(1f, 0.8f, 0.2f, 1f);
            main.loop = false;

            var emission = ps.emission;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 5, 10) });

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Cone;
            shape.angle = 15f;
            shape.radius = 0.05f;

            var renderer = ps.GetComponent<ParticleSystemRenderer>();
            renderer.material = new Material(Shader.Find("Sprites/Default"));

            Destroy(flash, 0.5f);
        }
    }
}
