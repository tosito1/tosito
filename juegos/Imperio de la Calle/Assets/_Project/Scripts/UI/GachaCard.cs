using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using MafiaTycoon.Data;

namespace MafiaTycoon.UI
{
    public class GachaCard : MonoBehaviour
    {
        [Header("UI References")]
        public Image cardImage;         // Portrait foreground
        public Image frameImage;        // Rarity border
        public Image backgroundPanel;   // Card background (Noir pattern)
        public Image cardBack;          // The "unrevealed" side
        
        [Header("Text Info")]
        public TextMeshProUGUI nameText;
        public TextMeshProUGUI rarityText;
        public TextMeshProUGUI typeText;

        [Header("Juice Settings")]
        public Image glowImage; // Pulsating aura
        public float baseShakeMagnitude = 5f;

        private CharacterRarity currentRarity;
        private bool isRevealed;

        [Header("Rarity Colors")]
        public Color commonColor = Color.gray;
        public Color rareColor = Color.blue;
        public Color epicColor = new Color(0.5f, 0, 0.5f); // Purple
        public Color legendaryColor = new Color(1, 0.84f, 0); // Gold

        public void Setup(CharacterData data)
        {
            currentRarity = data.rarity;
            nameText.text = data.characterName;
            rarityText.text = data.rarity.ToString().ToUpper();
            typeText.text = data.type.ToString();
            
            Color primaryColor = GetRarityColor(data.rarity);
            rarityText.color = primaryColor;
            frameImage.color = primaryColor;
            if (glowImage != null) glowImage.color = new Color(primaryColor.r, primaryColor.g, primaryColor.b, 0);
            
            isRevealed = false;
            cardBack.gameObject.SetActive(true);
            transform.localScale = Vector3.one;
        }

        public IEnumerator RevealSequence()
        {
            float shakeIntensity = currentRarity == CharacterRarity.Legendario ? 15f : baseShakeMagnitude;
            float flipDuration = currentRarity == CharacterRarity.Legendario ? 0.8f : 0.4f;

            // 1. Shake & Pulse
            StartCoroutine(PulseGlow());
            yield return StartCoroutine(ShakeCoroutine(0.8f, shakeIntensity));

            // 2. Flip
            yield return StartCoroutine(FlipCoroutine(flipDuration));

            // 3. Impact Burst
            if (UIParticleManager.Instance != null)
            {
                UIParticleManager.Instance.Burst(transform.localPosition, 20, GetRarityColor(currentRarity));
                if (currentRarity == CharacterRarity.Legendario) 
                    UIParticleManager.Instance.ScreenShake(10f, 0.3f);
            }

            isRevealed = true;
        }

        private IEnumerator PulseGlow()
        {
            if (glowImage == null) yield break;
            glowImage.gameObject.SetActive(true);

            float t = 0;
            while (!isRevealed)
            {
                float alpha = (Mathf.Sin(t * 10f) + 1f) / 2f;
                glowImage.color = new Color(glowImage.color.r, glowImage.color.g, glowImage.color.b, alpha * 0.5f);
                t += Time.deltaTime;
                yield return null;
            }
            glowImage.color = new Color(glowImage.color.r, glowImage.color.g, glowImage.color.b, 1f);
        }

        private IEnumerator FlipCoroutine(float duration)
        {
            float elapsed = 0;
            // Half flip (Closing)
            while (elapsed < duration / 2)
            {
                float angle = Mathf.Lerp(0, 90, elapsed / (duration / 2));
                transform.localRotation = Quaternion.Euler(0, angle, 0);
                elapsed += Time.deltaTime;
                yield return null;
            }

            // Switch visibility
            cardBack.gameObject.SetActive(false);
            
            // Half flip (Opening)
            elapsed = 0;
            while (elapsed < duration / 2)
            {
                float angle = Mathf.Lerp(90, 0, elapsed / (duration / 2));
                transform.localRotation = Quaternion.Euler(0, angle, 0);
                elapsed += Time.deltaTime;
                yield return null;
            }
        }

        private IEnumerator ShakeCoroutine(float duration, float magnitude)
        {
            Vector3 originalPos = transform.localPosition;
            float elapsed = 0;
            while (elapsed < duration)
            {
                float x = Random.Range(-1f, 1f) * magnitude;
                float y = Random.Range(-1f, 1f) * magnitude;
                transform.localPosition = new Vector3(originalPos.x + x, originalPos.y + y, originalPos.z);
                elapsed += Time.deltaTime;
                yield return null;
            }
            transform.localPosition = originalPos;
        }

        private Color GetRarityColor(CharacterRarity rarity)
        {
            switch (rarity)
            {
                case CharacterRarity.Raro: return rareColor;
                case CharacterRarity.Epico: return epicColor;
                case CharacterRarity.Legendario: return legendaryColor;
                default: return commonColor;
            }
        }
    }
}
