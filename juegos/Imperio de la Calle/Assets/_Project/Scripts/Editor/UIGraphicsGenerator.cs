using UnityEngine;
using UnityEditor;
using System.IO;

namespace MafiaTycoon.Editor
{
    public class UIGraphicsGenerator : EditorWindow
    {
        private static string outPath = "Assets/_Project/Art/UIGens/";

        [MenuItem("Mafia Tycoon/Generate Art Assets 🎨")]
        public static void GenerateAssets()
        {
            if (!Directory.Exists(outPath))
            {
                Directory.CreateDirectory(outPath);
            }

            GeneratePanelBG();
            GenerateCardBack();
            GenerateCardFrame();
            GeneratePortraitPlaceholders();
            GenerateZonePlaceholders();

            AssetDatabase.Refresh();
            SetTextureSettings();

            AssignGraphics();

            AssetDatabase.Refresh();
            
            // Set all to Sprite target
            SetTextureSettings();

            Debug.Log("✅ All UI Graphics Generated and Assigned successfully!");
        }

        private static void AssignGraphics()
        {
            // Try to assign the newly generated background
            Sprite panelSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(outPath, "ui_panel_bg.png"));
            Sprite zoneSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(outPath, "zone_bg.png"));
            
            UnityEngine.UI.Image[] allImages = Object.FindObjectsByType<UnityEngine.UI.Image>(FindObjectsInactive.Include);
            foreach (var img in allImages)
            {
                if (img.sprite == null)
                {
                    if (img.gameObject.name.Contains("Panel") || img.gameObject.name.Contains("Background"))
                    {
                        img.sprite = panelSprite;
                        Debug.Log($"Assigned panel sprite to {img.gameObject.name}");
                    }
                    else if (img.gameObject.name.Contains("Zone"))
                    {
                        img.sprite = zoneSprite;
                        Debug.Log($"Assigned zone sprite to {img.gameObject.name}");
                    }
                    else
                    {
                        // Default to panel sprite for unknown grey boxes
                        img.sprite = panelSprite;
                    }
                }
            }
            
            // For GachaCards that might be instantiated or in prefabs:
            // Since this is Editor script, finding prefabs is harder without exact paths, 
            // but we can try to find them in the hierarchy if they are loaded.
            MafiaTycoon.UI.GachaCard[] cards = Object.FindObjectsByType<MafiaTycoon.UI.GachaCard>(FindObjectsInactive.Include);
            Sprite cardBackSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(outPath, "gacha_card_back.png"));
            Sprite cardFrameSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(outPath, "gacha_card_frame.png"));
            
            foreach (var card in cards)
            {
                if (card.cardBack != null) card.cardBack.sprite = cardBackSprite;
                if (card.frameImage != null) card.frameImage.sprite = cardFrameSprite;
                if (card.backgroundPanel != null) card.backgroundPanel.sprite = panelSprite;
            }

            // Mark scenes as dirty
            UnityEditor.SceneManagement.EditorSceneManager.MarkAllScenesDirty();
        }

        private static void SetTextureSettings()
        {
            string[] files = Directory.GetFiles(outPath, "*.png");
            foreach (string file in files)
            {
                TextureImporter importer = AssetImporter.GetAtPath(file) as TextureImporter;
                if (importer != null)
                {
                    importer.textureType = TextureImporterType.Sprite;
                    importer.spriteImportMode = SpriteImportMode.Single;
                    importer.alphaIsTransparency = true;
                    // For UI slices to work well, we can try leaving border at 0, or calculate it.
                    importer.SaveAndReimport();
                }
            }
        }

        private static void GeneratePanelBG()
        {
            int w = 256;
            int h = 256;
            int border = 4;
            Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            Color darkBg = new Color(0.1f, 0.1f, 0.12f, 0.95f);
            Color goldBorder = new Color(0.83f, 0.68f, 0.21f, 1f);

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    if (x < border || x > w - border || y < border || y > h - border)
                        tex.SetPixel(x, y, goldBorder);
                    else
                        tex.SetPixel(x, y, darkBg);
                }
            }
            SaveTexture(tex, "ui_panel_bg.png");
        }

        private static void GenerateCardBack()
        {
            int w = 300;
            int h = 420;
            Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            Color baseColor = new Color(0.05f, 0.05f, 0.08f, 1f);
            Color stripColor = new Color(0.12f, 0.12f, 0.15f, 1f);
            Color gold = new Color(0.83f, 0.68f, 0.21f, 1f);

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    Color px = baseColor;
                    
                    // Pinstripes
                    if ((x + y) % 20 < 4) px = stripColor;

                    // Border
                    if (x < 8 || x > w - 8 || y < 8 || y > h - 8) px = gold;

                    // Center emblem (just a circle for now)
                    float cx = w / 2f;
                    float cy = h / 2f;
                    float dist = Vector2.Distance(new Vector2(x,y), new Vector2(cx, cy));
                    if (dist > 40 && dist < 50) px = gold;

                    tex.SetPixel(x, y, px);
                }
            }
            SaveTexture(tex, "gacha_card_back.png");
        }

        private static void GenerateCardFrame()
        {
            int w = 300;
            int h = 420;
            Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            Color outline = new Color(1f, 1f, 1f, 1f); // White, can be tinted by Image Component

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    // Transparent center
                    if (x > 12 && x < w - 12 && y > 12 && y < h - 12)
                        tex.SetPixel(x, y, new Color(0, 0, 0, 0));
                    else
                        tex.SetPixel(x, y, outline); 
                }
            }
            SaveTexture(tex, "gacha_card_frame.png");
        }

        private static void GeneratePortraitPlaceholders()
        {
            string[] names = { "Maton", "Hacker", "Contable", "Negociador", "Espia" };
            Color[] colors = { new Color(0.6f, 0.2f, 0.2f), new Color(0.2f, 0.6f, 0.2f), new Color(0.2f, 0.2f, 0.6f), new Color(0.6f, 0.6f, 0.2f), new Color(0.4f, 0.4f, 0.4f) };
            
            for (int i=0; i<names.Length; i++)
            {
                int w = 276;
                int h = 396; // Fits inside frame
                Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        float gradient = (float)y / h;
                        Color mixed = Color.Lerp(Color.black, colors[i], gradient);
                        tex.SetPixel(x, y, mixed);
                    }
                }
                SaveTexture(tex, $"portrait_{names[i].ToLower()}.png");
            }
        }

        private static void GenerateZonePlaceholders()
        {
            int w = 512;
            int h = 256;
            Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float factor = Mathf.PerlinNoise(x * 0.05f, y * 0.05f);
                    Color col = new Color(factor * 0.2f, factor * 0.2f, factor * 0.2f + 0.1f, 1f);
                    tex.SetPixel(x, y, col);
                }
            }
            SaveTexture(tex, "zone_bg.png");
        }

        private static void SaveTexture(Texture2D tex, string fileName)
        {
            tex.Apply();
            byte[] bytes = tex.EncodeToPNG();
            File.WriteAllBytes(Path.Combine(outPath, fileName), bytes);
            DestroyImmediate(tex);
        }
    }
}
