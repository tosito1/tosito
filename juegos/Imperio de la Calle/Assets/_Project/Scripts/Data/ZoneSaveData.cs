using System;

namespace MafiaTycoon.Data
{
    [Serializable]
    public class ZoneSaveData
    {
        public string id;
        public ZoneStatus status;
        public System.Collections.Generic.List<string> assignedDefenderIDs;

        public ZoneSaveData(string id, ZoneStatus status = ZoneStatus.Locked)
        {
            this.id = id;
            this.status = status;
            this.assignedDefenderIDs = new System.Collections.Generic.List<string>();
        }
    }
}
