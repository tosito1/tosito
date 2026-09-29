using UnityEngine;

namespace MafiaTycoon.Data
{
    public enum RandomEventType
    {
        Positive,
        Negative,
        Neutral
    }

    public enum RandomEventEffect
    {
        MoneyImpact,
        ReputationImpact,
        BusinessFreeze
    }

    [CreateAssetMenu(fileName = "NewRandomEvent", menuName = "MafiaTycoon/Random Event Data", order = 10)]
    public class RandomEventData : ScriptableObject
    {
        [Header("Identity")]
        public string eventID;
        public string title;
        [TextArea] public string description;
        public RandomEventType type;

        [Header("Impact")]
        public RandomEventEffect effect;
        public double effectValue; // Amount of money/rep or duration of freeze
        public float occurrenceWeight = 1.0f; // Higher means more common
    }
}
