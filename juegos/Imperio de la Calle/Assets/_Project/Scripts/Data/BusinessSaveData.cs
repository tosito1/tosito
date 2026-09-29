using System;

namespace MafiaTycoon.Data
{
    /// <summary>
    /// Stores the persistent state of a business.
    /// </summary>
    [Serializable]
    public class BusinessSaveData
    {
        public string id;
        public int level;
        public bool hasManager;
        public string assignedManagerID;

        public BusinessSaveData(string id, int level = 0)
        {
            this.id = id;
            this.level = level;
        }
    }
}
