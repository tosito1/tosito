using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using MafiaTycoon.Core;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Data;

namespace MafiaTycoon.UI
{
    public class RecruitmentUIController : MonoBehaviour
    {
        public static RecruitmentUIController Instance { get; private set; }

        [Header("UI Panels")]
        public GameObject recruitmentPanel;
        public GameObject cardDisplayArea;
        
        [Header("Gacha Elements")]
        public GachaCard cardPrefab;
        public Button rollButton;
        public TextMeshProUGUI costText;
        public TextMeshProUGUI statusText;

        private GachaCard currentCard;
        private bool isRolling = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (GachaManager.Instance != null)
            {
                costText.text = $"COSTO: ${GachaManager.Instance.rollCost:N0}";
            }
            
            rollButton.onClick.AddListener(OnRollClicked);
            recruitmentPanel.SetActive(true);
            cardDisplayArea.SetActive(false);
        }

        public void OnRollClicked()
        {
            if (isRolling) return;

            CharacterData result = GachaManager.Instance.RollCharacter();
            if (result != null)
            {
                StartCoroutine(RecruitmentSequence(result));
            }
            else
            {
                statusText.text = "¡Fondos insuficientes!";
                Invoke(nameof(ResetStatus), 2f);
            }
        }

        private IEnumerator RecruitmentSequence(CharacterData data)
        {
            isRolling = true;
            rollButton.interactable = false;
            statusText.text = "Reclutando...";

            // 1. Setup Card
            if (currentCard == null)
            {
                currentCard = Instantiate(cardPrefab, cardDisplayArea.transform);
            }
            currentCard.Setup(data);
            cardDisplayArea.SetActive(true);

            // 2. Play Reveal
            yield return StartCoroutine(currentCard.RevealSequence());

            // 3. Finalize recruitment
            CrewManager.Instance.RecruitCharacter(data);
            
            statusText.text = $"¡{data.characterName} se ha unido!";
            
            yield return new WaitForSeconds(2f);
            
            rollButton.interactable = true;
            isRolling = false;
        }

        private void ResetStatus()
        {
            statusText.text = "Selecciona un contrato";
        }
    }
}
