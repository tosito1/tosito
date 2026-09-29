using System;

namespace MafiaTycoon.Data
{
    /// <summary>
    /// Persistent state of a crew member.
    /// </summary>
    [Serializable]
    public class CharacterSaveData
    {
        public string id;
        public int level;
        public int currentExp;
        public System.Collections.Generic.List<string> equippedItemInstanceIDs;

        public CharacterSaveData(string id, int level = 1, int exp = 0)
        {
            this.id = id;
            this.level = level;
            this.currentExp = exp;
            this.equippedItemInstanceIDs = new System.Collections.Generic.List<string>();
        }
    }
}
