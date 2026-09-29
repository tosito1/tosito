using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using System.Linq;

namespace MafiaTycoon.Core
{
    public class RandomEventManager : MonoBehaviour
    {
        public static RandomEventManager Instance { get; private set; }

        [Header("Configuration")]
        public List<RandomEventData> allEvents;
        public float minTimeBetweenEvents = 120f; // 2 minutes
        public float maxTimeBetweenEvents = 300f; // 5 minutes

        [Header("State")]
        [SerializeField] private float nextEventTimer;
        
        // Static event for UI integration
        public static event System.Action<RandomEventData> OnRandomEventTriggered;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            ResetTimer();
        }

        private void Update()
        {
            nextEventTimer -= Time.deltaTime;
            if (nextEventTimer <= 0)
            {
                TriggerRandomEvent();
                ResetTimer();
            }
        }

        private void ResetTimer()
        {
            nextEventTimer = Random.Range(minTimeBetweenEvents, maxTimeBetweenEvents);
        }

        [ContextMenu("Trigger Random Event")]
        public void TriggerRandomEvent()
        {
            if (allEvents == null || allEvents.Count == 0) return;

            // Weighted Random Selection
            float totalWeight = allEvents.Sum(e => e.occurrenceWeight);
            float randomValue = Random.Range(0, totalWeight);
            float currentWeightSum = 0;

            RandomEventData selectedEvent = allEvents[0];
            foreach (var ev in allEvents)
            {
                currentWeightSum += ev.occurrenceWeight;
                if (randomValue <= currentWeightSum)
                {
                    selectedEvent = ev;
                    break;
                }
            }

            ApplyEventEffects(selectedEvent);
            OnRandomEventTriggered?.Invoke(selectedEvent);
        }

        private void ApplyEventEffects(RandomEventData eventData)
        {
            Debug.Log($"<color=white>[EVENT] {eventData.title}: {eventData.description}</color>");

            switch (eventData.effect)
            {
                case RandomEventEffect.MoneyImpact:
                    GameManager.Instance.AddMoney(eventData.effectValue);
                    break;
                
                case RandomEventEffect.ReputationImpact:
                    if (GameManager.Instance != null)
                    {
                        GameManager.Instance.data.reputation += (int)eventData.effectValue;
                    }
                    break;

                case RandomEventEffect.BusinessFreeze:
                    FreezeRandomBusiness((float)eventData.effectValue);
                    break;
            }
        }

        private void FreezeRandomBusiness(float duration)
        {
            var businesses = Object.FindObjectsByType<BusinessController>(FindObjectsInactive.Exclude);
            if (businesses.Length == 0) return;

            // Pick a random business that is currently active (level > 0)
            var activeBusinesses = businesses.Where(b => b.CurrentLevel > 0).ToList();
            if (activeBusinesses.Count == 0) return;

            var selected = activeBusinesses[Random.Range(0, activeBusinesses.Count)];
            selected.Freeze(duration);
            
            Debug.Log($"<color=red>[POLICE] Raid on {selected.config.businessName}! Operations frozen for {duration}s.</color>");
        }
    }
}
