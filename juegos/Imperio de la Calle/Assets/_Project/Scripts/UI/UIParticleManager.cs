using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

namespace MafiaTycoon.UI
{
    public class UIParticleManager : MonoBehaviour
    {
        public static UIParticleManager Instance { get; private set; }

        public GameObject sparkPrefab; // A simple UI Image with the star sprite

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Burst(Vector2 position, int count, Color color)
        {
            for (int i = 0; i < count; i++)
            {
                StartCoroutine(SpawnParticle(position, color));
            }
        }

        private IEnumerator SpawnParticle(Vector2 position, Color color)
        {
            GameObject p = new GameObject("SparkParticle", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            p.transform.SetParent(transform, false);
            
            Image img = p.GetComponent<Image>();
            img.color = color;
            // Note: In Unity, you'd assign the sprite here. We'll do it via AssetDatabase in GameSetupTool later.
            
            RectTransform rt = p.GetComponent<RectTransform>();
            rt.anchoredPosition = position;
            rt.sizeDelta = new Vector2(20, 20);

            Vector2 velocity = Random.insideUnitCircle * 300f;
            float life = 1f;
            float elapsed = 0;

            while (elapsed < life)
            {
                rt.anchoredPosition += velocity * Time.deltaTime;
                velocity += Vector2.down * 400f * Time.deltaTime; // Gravity
                
                float alpha = 1f - (elapsed / life);
                img.color = new Color(color.r, color.g, color.b, alpha);
                
                elapsed += Time.deltaTime;
                yield return null;
            }

            Destroy(p);
        }

        public void ScreenShake(float intensity, float duration)
        {
            StartCoroutine(ShakeCoroutine(intensity, duration));
        }

        private IEnumerator ShakeCoroutine(float intensity, float duration)
        {
            Vector3 originalPos = transform.localPosition;
            float elapsed = 0;
            while (elapsed < duration)
            {
                transform.localPosition = originalPos + (Vector3)(Random.insideUnitCircle * intensity);
                elapsed += Time.deltaTime;
                yield return null;
            }
            transform.localPosition = originalPos;
        }
    }
}
