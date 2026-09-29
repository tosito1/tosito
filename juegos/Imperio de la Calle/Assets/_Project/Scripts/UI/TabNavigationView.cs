using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

namespace MafiaTycoon.UI
{
    public class TabNavigationView : MonoBehaviour
    {
        [System.Serializable]
        public struct TabPanel
        {
            public string tabName;
            public Button tabButton;
            public GameObject panelContent;
        }

        [Header("Tab Configuration")]
        public List<TabPanel> tabs;
        public int defaultTabIndex = 0;

        private void Start()
        {
            for (int i = 0; i < tabs.Count; i++)
            {
                int index = i; // Closure
                tabs[i].tabButton.onClick.AddListener(() => SwitchTab(index));
            }

            SwitchTab(defaultTabIndex);
        }

        public void SwitchTab(int index)
        {
            if (index < 0 || index >= tabs.Count) return;

            for (int i = 0; i < tabs.Count; i++)
            {
                bool isActive = (i == index);
                tabs[i].panelContent.SetActive(isActive);
                
                // Optional: visual feedback for the button (color change)
                ColorBlock colors = tabs[i].tabButton.colors;
                colors.normalColor = isActive ? Color.white : Color.gray;
                tabs[i].tabButton.colors = colors;
            }
        }
    }
}
