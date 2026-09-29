using UnityEngine;
using UnityEngine.UI;
using TMPro;
using MafiaTycoon.Gameplay;
using System.Collections;

namespace MafiaTycoon.UI
{
    public class CombatPortrait : MonoBehaviour
    {
        [Header("UI References")]
        public Image portraitIcon;
        public Image healthBar;
        public TextMeshProUGUI nameText;
        public TextMeshProUGUI hpText;

        [Header("Visual Settings")]
        public Color normalColor = Color.white;
        public Color hitColor = Color.red;
        public Color deadColor = Color.gray;

        private float currentHp;
        private float maxHp;
        public string characterName { get; private set; }

        public void Setup(CharacterInstance character)
        {
            characterName = character.config.characterName;
            nameText.text = characterName;
            
            maxHp = character.GetMaxHealth();
            currentHp = maxHp;
            
            UpdateUI();
        }

        public void TakeDamage(float amount)
        {
            currentHp -= amount;
            if (currentHp < 0) currentHp = 0;
            
            StartCoroutine(FlashEffect());
            UpdateUI();
        }

        private void UpdateUI()
        {
            float fill = currentHp / maxHp;
            healthBar.fillAmount = fill;
            hpText.text = $"{currentHp:F0}/{maxHp:F0}";
        }

        public void TriggerAttackAnimation()
        {
            StartCoroutine(PunchEffect());
        }

        public void TriggerDeath()
        {
            portraitIcon.color = deadColor;
            nameText.text = $"<color=red>CAÍDO</color>";
        }

        private IEnumerator FlashEffect()
        {
            portraitIcon.color = hitColor;
            yield return new WaitForSeconds(0.1f);
            portraitIcon.color = currentHp > 0 ? normalColor : deadColor;
        }

        private IEnumerator PunchEffect()
        {
            Vector3 originalPos = transform.localPosition;
            transform.localPosition += new Vector3(10, 0, 0); // Jump forward a bit
            yield return new WaitForSeconds(0.1f);
            transform.localPosition = originalPos;
        }
    }
}
