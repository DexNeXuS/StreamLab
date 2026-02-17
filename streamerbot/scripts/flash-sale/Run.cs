using System;
using System.Collections.Generic;
using Newtonsoft.Json;

public class CPHInline
{
    private const string TIMER_ID = "84bd9247-8750-45cf-a471-bbe8c50a8835";
    private const string GLOBAL_KEY_PRICES = "FlashSale_OriginalRewards";
    private const string GLOBAL_KEY_ACTIVE = "FlashSale_Active";

    public bool Execute()
    {
        // ─────────────────────────────
        // PRIORITY: Check for timer trigger indicators FIRST
        // ─────────────────────────────
        bool isLikelyTimerTrigger = CPH.TryGetArg("counter", out int _); // %counter% only from Timed Action

        bool isRestoreMode = false;
        CPH.TryGetArg("mode", out string modeArg);
        if (modeArg == "restore") isRestoreMode = true;

        if (isLikelyTimerTrigger || isRestoreMode)
        {
            // ─────────────────────────────
            // TIMER FIRED → RESTORE
            // ─────────────────────────────
            string json = CPH.GetGlobalVar<string>(GLOBAL_KEY_PRICES, true);
            if (string.IsNullOrWhiteSpace(json))
            {
                CPH.DisableTimerById(TIMER_ID);
                CPH.SetGlobalVar(GLOBAL_KEY_ACTIVE, false, true);
                return true;
            }

            var originalPrices = JsonConvert.DeserializeObject<Dictionary<string, int>>(json);
            var rewards = CPH.TwitchGetRewards();

            int restoredCount = 0;
            foreach (var reward in rewards)
            {
                if (originalPrices.TryGetValue(reward.Id, out int originalCost))
                {
                    CPH.UpdateReward(reward.Id, null, null, originalCost, null);
                    restoredCount++;
                }
            }

            CPH.SetGlobalVar(GLOBAL_KEY_PRICES, null, true);
            CPH.SetGlobalVar(GLOBAL_KEY_ACTIVE, false, true);
            CPH.DisableTimerById(TIMER_ID);

            // Big announcement for sale end
            string endMessage = $"🟣 Flash sale ended — {restoredCount} active rewards restored to normal prices!";
            CPH.TwitchAnnounce(endMessage, bot: true, color: "blue", fallback: true);

            return true;
        }

        // ─────────────────────────────
        // MANUAL TRIGGER → START SALE
        // ─────────────────────────────
        bool saleActive = CPH.GetGlobalVar<bool>(GLOBAL_KEY_ACTIVE, true);
        if (saleActive)
        {
            CPH.SendMessage("⚠️ A flash sale is already running!");
            return true;
        }

        // Get args
        CPH.TryGetArg("percentOff", out int percentOff);
        CPH.TryGetArg("saleTimer", out int saleTimer);
        CPH.TryGetArg("cpPrice", out int cpPrice);
        CPH.TryGetArg("fairPrice", out int fairPrice);

        // Defaults / clamps
        percentOff = percentOff <= 0 ? 99 : Math.Min(99, percentOff);
        saleTimer  = saleTimer  <= 0 ? 30 : saleTimer;
        fairPrice  = fairPrice  <= 0 ? 500 : fairPrice;

        bool isFixedPriceMode = cpPrice > 0;

        var rewardList = CPH.TwitchGetRewards();
        if (rewardList.Count == 0)
        {
            CPH.SendMessage("⚠️ No channel point rewards found!");
            return true;
        }

        var priceBackup = new Dictionary<string, int>();
        int updatedCount = 0;

        foreach (var reward in rewardList)
        {
            if (!reward.Enabled) continue;

            priceBackup[reward.Id] = reward.Cost;

            int newCost;
            if (isFixedPriceMode)
            {
                newCost = Math.Max(1, cpPrice);
            }
            else
            {
                newCost = Math.Max(1, (int)(reward.Cost * (100 - percentOff) / 100.0));
            }

            CPH.UpdateReward(reward.Id, null, null, newCost, null);
            updatedCount++;
        }

        if (updatedCount == 0)
        {
            CPH.SendMessage("⚠️ No enabled rewards available to put on sale!");
            return true;
        }

        // Prepare sale message
        string saleMessage;
        if (isFixedPriceMode)
        {
            string tone;
            if (cpPrice > fairPrice)
                tone = "😈 We're straight-up RIPPING viewers off! ";
            else if (cpPrice < fairPrice)
                tone = "🔥 INCREDIBLE deal alert! ";
            else
                tone = "🟰 Straight flat pricing – fair game! ";

            saleMessage = $"{tone}All active rewards set to {cpPrice} points for {saleTimer} seconds!";
        }
        else
        {
            saleMessage = $"🔥 CHANNEL POINT FLASH SALE! {percentOff}% OFF on {updatedCount} active rewards for {saleTimer} seconds! 🔥";
        }

        // Save backup & activate timer
        CPH.SetGlobalVar(GLOBAL_KEY_PRICES, JsonConvert.SerializeObject(priceBackup), true);
        CPH.SetGlobalVar(GLOBAL_KEY_ACTIVE, true, true);

        CPH.SetTimerInterval(TIMER_ID, saleTimer); // seconds
        CPH.EnableTimerById(TIMER_ID);

        // Big announcement for sale start
        CPH.TwitchAnnounce(saleMessage, bot: true, color: "purple", fallback: true);

        return true;
    }
}
