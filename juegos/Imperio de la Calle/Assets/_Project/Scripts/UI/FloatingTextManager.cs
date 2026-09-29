using UnityEngine;
using TMPro;
using MafiaTycoon.Core;

namespace MafiaTycoon.UI
{
    public class FloatingTextManager : MonoBehaviour
    {
        public static FloatingTextManager Instance { get; private set; }

        [Header("Settings")]
        public GameObject floatingTextPrefab;
        public float duration = 1.0f;
        public Vector3 offset = new Vector3(0, 50, 0);

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnEnable()
        {
            GameManager.OnMoneyEarned += HandleMoneyEarned;
        }

        private void OnDisable()
        {
            GameManager.OnMoneyEarned -= HandleMoneyEarned;
        }

        private void HandleMoneyEarned(double amount)
        {
            // Only show for manual or major earnings to avoid clutter?
            // For now, let's just provide the method to call manually when needed
        }

        public void SpawnFloatingText(string text, Vector2 screenPosition, Color color)
        {
            GameObject go = Instantiate(floatingTextPrefab, transform);
            go.transform.position = screenPosition;

            TextMeshProUGUI tmp = go.GetComponent<TextMeshProUGUI>();
            if (tmp != null)
            {
                tmp.text = text;
                tmp.color = color;
            }

            // Simple "rising" animation logic
            StartCoroutine(FloatingAnimation(go));
        }

        private System.Collections.IEnumerator FloatingAnimation(GameObject obj)
        {
            float elapsed = 0;
            Vector3 startPos = obj.transform.position;
            Vector3 endPos = startPos + offset;

            CanvasGroup group = obj.GetComponent<CanvasGroup>();

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                
                obj.transform.position = Vector3.Lerp(startPos, endPos, t);
                if (group != null) group.alpha = 1 - t;
                
                yield return null;
            }

            Destroy(obj);
        }
    }
}
