using UnityEngine;
using UnityEditor;
using System.IO;
using MafiaTycoon.Gameplay.Shooter;

namespace MafiaTycoon.Editor
{
    public class ShooterSetup : EditorWindow
    {
        private static string artPath = "Assets/_Project/Art/Shooter/";
        private static string prefabPath = "Assets/_Project/Prefabs/Shooter/";

        [MenuItem("Mafia Tycoon/Setup Shooter Assets & Scene 🔫")]
        public static void GenerateShooterAssets()
        {
            if (!Directory.Exists(artPath)) Directory.CreateDirectory(artPath);
            if (!Directory.Exists(prefabPath)) Directory.CreateDirectory(prefabPath);

            // 1. Generate Textures (Only if missing! We have high-quality AI sprites now)
            if (!File.Exists(Path.Combine(artPath, "player_topdown.png")))
                GenerateTopDownSprite("player_topdown", new Color(0.2f, 0.4f, 0.8f));
            if (!File.Exists(Path.Combine(artPath, "enemy_topdown.png")))
                GenerateTopDownSprite("enemy_topdown", new Color(0.8f, 0.2f, 0.2f));

            if (!File.Exists(Path.Combine(artPath, "bullet.png"))) GenerateBulletSprite();
            if (!File.Exists(Path.Combine(artPath, "obstacle.png"))) GenerateObstacleSprite();
            if (!File.Exists(Path.Combine(artPath, "asphalt_floor.png"))) GenerateAsphaltSprite();

            // Force Sprite type for AI-generated images we copied earlier
            SetTextureSettings(Path.Combine(artPath, "player_topdown.png"));
            SetTextureSettings(Path.Combine(artPath, "enemy_topdown.png"));

            // 2. Refresh AssetDatabase to use Sprites
            AssetDatabase.Refresh();
            
            // Re-load sprites as proper Sprite references
            Sprite playerSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(artPath, "player_topdown.png"));
            Sprite enemySprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(artPath, "enemy_topdown.png"));
            Sprite bulletSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(artPath, "bullet.png"));
            Sprite obstacleSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(artPath, "obstacle.png"));
            Sprite asphaltSprite = AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(artPath, "asphalt_floor.png"));

            // 3. Create Prefabs
            GameObject bulletPrefab = CreateBulletPrefab(bulletSprite);
            GameObject playerPrefab = CreatePlayerPrefab(playerSprite, bulletPrefab);
            GameObject enemyPrefab = CreateEnemyPrefab(enemySprite, bulletPrefab);

            // 4. Setup Scene
            SetupShooterScene(playerPrefab, enemyPrefab, obstacleSprite, asphaltSprite);

            Debug.Log("✅ Shooter Setup Complete! Press Play and attempt to conquer a territory to test it.");
        }

        private static Sprite GenerateTopDownSprite(string name, Color color)
        {
            int s = 128;
            Texture2D tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float cx = s/2f; float cy = s/2f;
                    float dist = Vector2.Distance(new Vector2(x,y), new Vector2(cx, cy));
                    
                    if (dist < 40) // Body
                        tex.SetPixel(x, y, color);
                    else if (dist < 50 && y > s/2f) // Shoulders/Weapon forward
                        tex.SetPixel(x, y, new Color(0.2f, 0.2f, 0.2f));
                    else
                        tex.SetPixel(x, y, Color.clear);
                }
            }
            return SaveAndGetSprite(tex, name + ".png");
        }

        private static Sprite GenerateBulletSprite()
        {
            Texture2D tex = new Texture2D(16, 32, TextureFormat.RGBA32, false);
            for (int y = 0; y < 32; y++)
            {
                for (int x = 0; x < 16; x++)
                {
                    if (x > 4 && x < 12 && y > 4 && y < 28)
                        tex.SetPixel(x, y, new Color(1f, 0.9f, 0.2f));
                    else
                        tex.SetPixel(x, y, Color.clear);
                }
            }
            return SaveAndGetSprite(tex, "bullet.png");
        }

        private static Sprite GenerateAsphaltSprite()
        {
            int s = 512;
            Texture2D tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    // Dark asphalt noise
                    float noise = Mathf.PerlinNoise(x * 0.1f, y * 0.1f);
                    float baseVal = 0.15f + (noise * 0.05f);
                    Color c = new Color(baseVal, baseVal, baseVal + 0.02f);
                    
                    // Center yellow dashed line
                    if (x > 245 && x < 267)
                    {
                        if (y % 128 < 80) 
                            c = new Color(0.9f, 0.7f, 0.1f); // Better yellow
                    }
                    tex.SetPixel(x, y, c);
                }
            }
            return SaveAndGetSprite(tex, "asphalt_floor.png");
        }

        private static Sprite GenerateObstacleSprite()
        {
            Texture2D tex = new Texture2D(128, 128, TextureFormat.RGBA32, false);
            for (int y = 0; y < 128; y++)
            {
                for (int x = 0; x < 128; x++)
                {
                    if (x < 4 || x > 124 || y < 4 || y > 124)
                        tex.SetPixel(x, y, new Color(0.1f, 0.1f, 0.1f)); // Border
                    else
                        tex.SetPixel(x, y, new Color(0.3f, 0.3f, 0.3f)); // Fill
                }
            }
            return SaveAndGetSprite(tex, "obstacle.png");
        }

        private static Sprite SaveAndGetSprite(Texture2D tex, string filename)
        {
            tex.Apply();
            string relativePath = Path.Combine(artPath, filename);
            string fullPath = Path.GetFullPath(relativePath);
            File.WriteAllBytes(fullPath, tex.EncodeToPNG());
            
            AssetDatabase.ImportAsset(relativePath);
            SetTextureSettings(relativePath);
            
            return AssetDatabase.LoadAssetAtPath<Sprite>(relativePath);
        }

        private static void SetTextureSettings(string path)
        {
            TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
            if (importer != null)
            {
                importer.textureType = TextureImporterType.Sprite;
                importer.spriteImportMode = SpriteImportMode.Single;
                importer.spritePixelsPerUnit = 400; // Force characters to be an appropriate size on-screen
                importer.mipmapEnabled = false;
                importer.filterMode = FilterMode.Point;
                AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate);
            }
        }

        private static GameObject CreateBulletPrefab(Sprite sprite)
        {
            GameObject go = new GameObject("Projectile");
            go.AddComponent<SpriteRenderer>().sprite = sprite;
            BoxCollider2D col = go.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            
            Rigidbody2D rb = go.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Kinematic;

            go.AddComponent<Projectile>();
            
            string path = Path.Combine(prefabPath, "Projectile.prefab");
            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(go, path);
            DestroyImmediate(go);
            return prefab;
        }

        private static GameObject CreatePlayerPrefab(Sprite sprite, GameObject bullet)
        {
            GameObject go = new GameObject("PlayerTopDown");
            go.AddComponent<SpriteRenderer>().sprite = sprite;
            go.AddComponent<CircleCollider2D>();
            
            Rigidbody2D rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0; rb.freezeRotation = true;
            
            ShooterHealth health = go.AddComponent<ShooterHealth>();
            health.maxHealth = 200; health.isPlayer = true;

            ShooterPlayerController pc = go.AddComponent<ShooterPlayerController>();
            pc.projectilePrefab = bullet;
            
            GameObject firePoint = new GameObject("FirePoint");
            firePoint.transform.parent = go.transform;
            firePoint.transform.localPosition = new Vector3(0, 1f, 0); // pointing up
            pc.firePoint = firePoint.transform;

            string path = Path.Combine(prefabPath, "Player.prefab");
            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(go, path);
            DestroyImmediate(go);
            return prefab;
        }

        private static GameObject CreateEnemyPrefab(Sprite sprite, GameObject bullet)
        {
            GameObject go = new GameObject("EnemyTopDown");
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.color = new Color(1f, 0.4f, 0.4f); // Red tint for enemies!
            
            go.AddComponent<CircleCollider2D>();
            
            Rigidbody2D rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0; rb.freezeRotation = true;
            
            ShooterHealth health = go.AddComponent<ShooterHealth>();
            health.maxHealth = 50; health.isPlayer = false;

            ShooterEnemyAI ai = go.AddComponent<ShooterEnemyAI>();
            ai.projectilePrefab = bullet;
            
            GameObject firePoint = new GameObject("FirePoint");
            firePoint.transform.parent = go.transform;
            firePoint.transform.localPosition = new Vector3(0, 1f, 0);
            ai.firePoint = firePoint.transform;

            string path = Path.Combine(prefabPath, "Enemy.prefab");
            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(go, path);
            DestroyImmediate(go);
            return prefab;
        }

        private static void SetupShooterScene(GameObject playerPref, GameObject enemyPref, Sprite obstacleSprite, Sprite floorSprite)
        {
            GameObject managerObj = GameObject.Find("ShooterManager");
            if (managerObj == null) managerObj = new GameObject("ShooterManager");
            
            ShooterManager sm = managerObj.GetComponent<ShooterManager>();
            if (sm == null) sm = managerObj.AddComponent<ShooterManager>();

            sm.playerPrefab = playerPref;
            sm.enemyPrefab = enemyPref;

            // Generate Map Base
            Transform mapBase = managerObj.transform.Find("MapBase");
            if (mapBase != null) DestroyImmediate(mapBase.gameObject);
            
            GameObject map = new GameObject("MapBase");
            map.transform.parent = managerObj.transform;

            // GTA Style Asphalt Floor
            GameObject floor = new GameObject("AsphaltFloor");
            floor.transform.parent = map.transform;
            SpriteRenderer sr = floor.AddComponent<SpriteRenderer>();
            sr.sprite = floorSprite;
            sr.drawMode = SpriteDrawMode.Tiled;
            sr.size = new Vector2(30, 30);
            floor.transform.localScale = Vector3.one;

            // Obstacles
            Vector2[] pos = { new Vector2(-5, 5), new Vector2(5, 5), new Vector2(-5, -5), new Vector2(5, -5) };
            foreach (var p in pos)
            {
                GameObject obs = new GameObject("Building");
                // Removed Tag lookup to avoid runtime errors, using component instead
                obs.transform.parent = map.transform;
                obs.transform.position = p;
                obs.AddComponent<SpriteRenderer>().sprite = obstacleSprite;
                obs.AddComponent<BoxCollider2D>();
                obs.AddComponent<ShooterObstacle>(); 
                obs.transform.localScale = new Vector3(3, 3, 1);
            }

            // Spawn points
            GameObject pSpawn = new GameObject("PlayerSpawn");
            pSpawn.transform.parent = map.transform;
            pSpawn.transform.position = new Vector3(0, -8, 0);
            sm.playerSpawnPoint = pSpawn.transform;

            GameObject[] eSpawns = new GameObject[4];
            for (int i=0; i<4; i++)
            {
                GameObject esp = new GameObject("EnemySpawn" + i);
                esp.transform.parent = map.transform;
                esp.transform.position = pos[i] + new Vector2(0, 2);
                eSpawns[i] = esp;
            }
            sm.enemySpawnPoints = new Transform[] { eSpawns[0].transform, eSpawns[1].transform, eSpawns[2].transform, eSpawns[3].transform };

            // Hide the scene mapping initially
            map.SetActive(false);

            UnityEditor.SceneManagement.EditorSceneManager.MarkAllScenesDirty();
        }
    }
}
