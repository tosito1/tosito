using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using MafiaTycoon.Core;
using MafiaTycoon.UI;
using MafiaTycoon.Gameplay;
using MafiaTycoon.Data;
using System.Collections.Generic;

namespace MafiaTycoon.Editor
{
    public class GameSetupTool : EditorWindow
    {
        private static Color MafiaGold = new Color(0.85f, 0.65f, 0.12f);
        private static Color MafiaBlack = new Color(0.05f, 0.05f, 0.05f);

        [MenuItem("Mafia Tycoon/Setup Full Scene (Visual)")]
        public static void SetupScene()
        {
            // 0. Cleanup Old
            var existingCanvas = GameObject.Find("UI_Canvas");
            if (existingCanvas != null) DestroyImmediate(existingCanvas);
            var existingManagers = GameObject.Find("_Managers");
            if (existingManagers != null) DestroyImmediate(existingManagers);

            // 1. Setup Managers
            GameObject managersObj = new GameObject("_Managers");
            managersObj.AddComponent<GameManager>();
            managersObj.AddComponent<BusinessManager>();
            managersObj.AddComponent<CrewManager>();
            managersObj.AddComponent<ZoneManager>();
            managersObj.AddComponent<QuestManager>();
            managersObj.AddComponent<PlayerLevelManager>();
            managersObj.AddComponent<PrestigeManager>();
            managersObj.AddComponent<CombatManager>();
            managersObj.AddComponent<GachaManager>();
            managersObj.AddComponent<UIParticleManager>();
            
            // 2. Setup Camera
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                cam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
            }
            cam.backgroundColor = MafiaBlack;
            cam.clearFlags = CameraClearFlags.SolidColor;

            // 3. Setup Canvas
            GameObject canvasObj = new GameObject("UI_Canvas", typeof(RectTransform));
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasObj.AddComponent<GraphicRaycaster>();
            
            // 4. Background
            GameObject bgObj = new GameObject("Background_Image", typeof(RectTransform));
            bgObj.transform.SetParent(canvasObj.transform, false);
            Image bgImage = bgObj.AddComponent<Image>();
            bgImage.sprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Art/Backgrounds/MainCity.png");
            if (bgImage.sprite == null) bgImage.color = new Color(0.3f, 0.3f, 0.3f);
            SetRectTransform(bgObj.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero);

            // 5. HUD Construction
            GameObject hudObj = new GameObject("HUD_Panel", typeof(RectTransform));
            hudObj.transform.SetParent(canvasObj.transform, false);
            HUDController hud = hudObj.AddComponent<HUDController>();
            RectTransform hudRect = hudObj.GetComponent<RectTransform>();
            hudRect.anchorMin = new Vector2(0, 0.9f);
            hudRect.anchorMax = new Vector2(1, 1);
            hudRect.offsetMin = hudRect.offsetMax = Vector2.zero;

            hud.moneyText = CreateText("MoneyText", hudObj.transform, "Money: $0", new Vector2(20, -10), 30);
            hud.incomeText = CreateText("IncomeText", hudObj.transform, "+$0/s", new Vector2(20, -45), 20);
            hud.levelText = CreateText("LevelText", hudObj.transform, "Nivel 1", new Vector2(-20, -10), 24, TextAlignmentOptions.Right);
            
            // 6. Tab Navigation
            GameObject tabNavObj = new GameObject("Tab_Navigation", typeof(RectTransform));
            tabNavObj.transform.SetParent(canvasObj.transform, false);
            TabNavigationView tabNav = tabNavObj.AddComponent<TabNavigationView>();
            tabNav.tabs = new List<TabNavigationView.TabPanel>();

            string[] tabNames = { "Negocios", "Banda", "Zonas", "Misiones" };
            for (int i = 0; i < tabNames.Length; i++)
            {
                // Create Panel
                GameObject panel = new GameObject($"Panel_{tabNames[i]}", typeof(RectTransform));
                panel.transform.SetParent(canvasObj.transform, false);
                SetRectTransform(panel.GetComponent<RectTransform>(), new Vector2(0, 0.1f), new Vector2(1, 0.9f), Vector2.zero);
                
                // Create Button
                GameObject btn = new GameObject($"Btn_{tabNames[i]}", typeof(RectTransform));
                btn.transform.SetParent(tabNavObj.transform, false);
                Button button = btn.AddComponent<Button>();
                CreateText("BtnText", btn.transform, tabNames[i], Vector2.zero, 18, TextAlignmentOptions.Center);
                
                tabNav.tabs.Add(new TabNavigationView.TabPanel { 
                    tabName = tabNames[i], 
                    tabButton = button, 
                    panelContent = panel 
                });
            }

            // 7. Special logic for Business List
            GameObject scrollList = new GameObject("BusinessScrollList", typeof(RectTransform));
            scrollList.transform.SetParent(tabNav.tabs[0].panelContent.transform, false);
            scrollList.AddComponent<BusinessUIList>();

            // 8. Special logic for City Map (Zonas Tab)
            GameObject mapPanel = tabNav.tabs[2].panelContent;
            GameObject mapBg = new GameObject("CityMap_Background", typeof(RectTransform));
            mapBg.transform.SetParent(mapPanel.transform, false);
            Image mapImg = mapBg.AddComponent<Image>();
            mapImg.sprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Art/UI/MafiaCityMap.png"); // Assuming renamed path
            SetRectTransform(mapBg.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero);

            // Create Map Nodes (Placeholder relative positions)
            string[] zoneNames = { "Docks", "Industrial", "Downtown", "Slums", "Uptown" };
            Vector2[] zonePos = { new Vector2(-200, -100), new Vector2(-150, 150), new Vector2(0, 0), new Vector2(200, -50), new Vector2(100, 200) };
            
            for (int i = 0; i < zoneNames.Length; i++)
            {
                GameObject nodeObj = new GameObject($"Node_{zoneNames[i]}", typeof(RectTransform));
                nodeObj.transform.SetParent(mapBg.transform, false);
                MapNodeUI node = nodeObj.AddComponent<MapNodeUI>();
                node.zoneID = zoneNames[i].ToLower();
                
                // Add an image for the node
                GameObject nodeIcon = new GameObject("Icon", typeof(RectTransform));
                nodeIcon.transform.SetParent(nodeObj.transform, false);
                node.statusOverlay = nodeIcon.AddComponent<Image>();
                node.statusOverlay.color = node.lockedColor;
                
                RectTransform rt = nodeObj.GetComponent<RectTransform>();
                rt.anchoredPosition = zonePos[i];
                rt.sizeDelta = new Vector2(60, 60);

                node.zoneNameText = CreateText("Name", nodeObj.transform, zoneNames[i], new Vector2(0, -40), 14, TextAlignmentOptions.Center);
            }

            // 9. Territory Detail Panel
            GameObject detailPanelObj = new GameObject("TerritoryDetailPanel", typeof(RectTransform));
            detailPanelObj.transform.SetParent(canvasObj.transform, false);
            TerritoryManagementPanel detailPanel = detailPanelObj.AddComponent<TerritoryManagementPanel>();
            detailPanel.mainPanel = detailPanelObj; // Simplified for now
            // In a real setup, we'd add more children here (Title, Desc, Buttons)

            Selection.activeGameObject = managersObj;
            Debug.Log("<color=green>Mafia Tycoon: Visual Scene & Interactive Map successfully constructed!</color>");
        }

        private static TextMeshProUGUI CreateText(string name, Transform parent, string initText, Vector2 pos, float size, TextAlignmentOptions align = TextAlignmentOptions.Left)
        {
            GameObject obj = new GameObject(name, typeof(RectTransform));
            obj.transform.SetParent(parent, false);
            TextMeshProUGUI tmp = obj.AddComponent<TextMeshProUGUI>();
            tmp.text = initText;
            tmp.fontSize = size;
            tmp.color = MafiaGold;
            tmp.alignment = align;
            
            RectTransform rt = obj.GetComponent<RectTransform>();
            if (align == TextAlignmentOptions.Right)
            {
                rt.anchorMin = rt.anchorMax = new Vector2(1, 1);
                rt.pivot = new Vector2(1, 1);
            }
            else if (align == TextAlignmentOptions.Center)
            {
                rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
                rt.pivot = new Vector2(0.5f, 0.5f);
            }
            else
            {
                rt.anchorMin = rt.anchorMax = new Vector2(0, 1);
                rt.pivot = new Vector2(0, 1);
            }
            rt.anchoredPosition = pos;
            rt.sizeDelta = new Vector2(300, 50);
            
            return tmp;
        }

        private static void SetRectTransform(RectTransform rt, Vector2 min, Vector2 max, Vector3 pos)
        {
            rt.anchorMin = min;
            rt.anchorMax = max;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }

        [MenuItem("Mafia Tycoon/Generate Initial Assets")]
        public static void GenerateInitialAssets()
        {
            // 1. Create Businesses
            CreateBusiness("Speakeasy", "Bar Clandestino", 10, 1, 2f);
            CreateBusiness("Casino", "Casino Subterráneo", 500, 25, 5f);
            CreateBusiness("Warehouse", "Almacén de Armas", 2500, 150, 10f);

            // 2. Create Characters
            CreateCharacter("Enforcer", "El Matón", 10, 5, 0.05f);
            CreateCharacter("Accountant", "El Contable", 2, 2, 0.15f);
            CreateCharacter("FemmeFatale", "La Viuda", 15, 8, 0.02f);

            AssetDatabase.Refresh();
            AssetDatabase.SaveAssets();
            Debug.Log("<color=cyan>Full Starter Content Generated and Art Linked!</color>");
        }

        private static void CreateBusiness(string id, string name, double cost, double prod, float cycle)
        {
            BusinessData b = ScriptableObject.CreateInstance<BusinessData>();
            b.businessID = id;
            b.businessName = name;
            b.baseCost = cost;
            b.baseProduction = prod;
            b.baseCycleTime = cycle;
            
            // Try to find matching art
            b.icon = AssetDatabase.LoadAssetAtPath<Sprite>($"Assets/_Project/Art/Icons/{id}.png");
            
            string path = $"Assets/_Project/Data/Businesses/{id}.asset";
            if (!System.IO.Directory.Exists("Assets/_Project/Data/Businesses/"))
                System.IO.Directory.CreateDirectory("Assets/_Project/Data/Businesses/");
                
            AssetDatabase.CreateAsset(b, path);
        }

        private static void CreateCharacter(string id, string name, int atk, int def, float bonus)
        {
            CharacterData c = ScriptableObject.CreateInstance<CharacterData>();
            c.characterID = id;
            c.characterName = name;
            c.baseAttack = atk;
            c.baseDefense = def;
            c.baseEconomicBonus = bonus;
            
            // Try to find matching art
            c.portrait = AssetDatabase.LoadAssetAtPath<Sprite>($"Assets/_Project/Art/Portraits/{id}.png");
            
            string path = $"Assets/_Project/Data/Characters/{id}.asset";
            if (!System.IO.Directory.Exists("Assets/_Project/Data/Characters/"))
                System.IO.Directory.CreateDirectory("Assets/_Project/Data/Characters/");

            AssetDatabase.CreateAsset(c, path);
        }
    }
}
