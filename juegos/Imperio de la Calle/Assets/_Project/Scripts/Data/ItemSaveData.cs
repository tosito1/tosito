namespace MafiaTycoon.Data
{
    public enum ItemType
    {
        Arma,
        Armadura,
        Accesorio
    }

    [System.Serializable]
    public class ItemSaveData
    {
        public string instanceID; // Unique ID for this specific item instance
        public string itemID;     // ID from ItemData SO
        public string equippedToCharacterID; // ID of character equipping this, or empty

        public ItemSaveData(string itemID)
        {
            this.instanceID = System.Guid.NewGuid().ToString();
            this.itemID = itemID;
            this.equippedToCharacterID = string.Empty;
        }
    }
}
