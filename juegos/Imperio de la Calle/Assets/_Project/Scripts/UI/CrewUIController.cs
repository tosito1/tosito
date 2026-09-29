using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Core;
using TMPro;

namespace MafiaTycoon.UI
{
    public class CrewUIController : MonoBehaviour
    {
        [Header("Settings")]
        public GameObject characterItemPrefab;
        public Transform gridParent;

        private void Start()
        {
            InvokeRepeating(nameof(RefreshCrewUI), 1f, 5f);
        }

        public void RefreshCrewUI()
        {
            if (CrewManager.Instance == null) return;

            // Simple clear (not optimized for large lists, but fine for now)
            foreach (Transform child in gridParent) Destroy(child.gameObject);

            foreach (var character in CrewManager.Instance.activeCrew)
            {
                GameObject go = Instantiate(characterItemPrefab, gridParent);
                // Assume a simple script on the prefab to set text
                CharacterUIItem item = go.GetComponent<CharacterUIItem>();
                if (item != null) item.Setup(character);
            }
        }
    }

    // Helper class for the individual character item
    public class CharacterUIItem : MonoBehaviour
    {
        public TextMeshProUGUI nameText;
        public TextMeshProUGUI levelText;
        public TextMeshProUGUI statsText;

        public void Setup(CharacterInstance character)
        {
            nameText.text = character.config.characterName;
            levelText.text = $"Nvl: {character.Level} ({character.config.rarity})";
            statsText.text = $"Atk: {character.GetCurrentAttack():F0} | Def: {character.GetCurrentDefense():F0}";
        }
    }
}
