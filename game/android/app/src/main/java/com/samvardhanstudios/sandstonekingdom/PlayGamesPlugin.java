package com.samvardhanstudios.sandstonekingdom;

import android.app.Activity;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

import java.nio.charset.StandardCharsets;

/**
 * Google Play Games Services v2 for the game: sign-in, achievements, leaderboards,
 * Saved Games (cloud save) and the Play in-app review prompt.
 * Everything is skipped safely while the Play Games project ID is not set yet
 * (res/values/strings.xml: game_services_project_id).
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {
    private static final int RC_UI = 9004;
    private boolean initialized = false;

    private boolean configured() {
        int id = getContext().getResources().getIdentifier("game_services_project_id", "string", getContext().getPackageName());
        if (id == 0) return false;
        String v = getContext().getString(id).trim();
        if (v.isEmpty() || v.equals("0")) return false;
        return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(getContext()) == ConnectionResult.SUCCESS;
    }

    private boolean ready(PluginCall call) {
        if (!configured()) { call.reject("Play Games is not set up"); return false; }
        if (!initialized) { PlayGamesSdk.initialize(getContext()); initialized = true; }
        return true;
    }

    private void resolvePlayer(PluginCall call, boolean signedIn) {
        Activity a = getActivity();
        JSObject r = new JSObject();
        r.put("signedIn", signedIn);
        if (!signedIn) { call.resolve(r); return; }
        PlayGames.getPlayersClient(a).getCurrentPlayer().addOnCompleteListener(t -> {
            if (t.isSuccessful() && t.getResult() != null) {
                r.put("displayName", t.getResult().getDisplayName());
                r.put("playerId", t.getResult().getPlayerId());
            }
            call.resolve(r);
        });
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", configured());
        call.resolve(r);
    }

    @PluginMethod
    public void isSignedIn(PluginCall call) {
        if (!ready(call)) return;
        PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().addOnCompleteListener(t ->
            resolvePlayer(call, t.isSuccessful() && t.getResult() != null && t.getResult().isAuthenticated()));
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (!ready(call)) return;
        PlayGames.getGamesSignInClient(getActivity()).signIn().addOnCompleteListener(t ->
            resolvePlayer(call, t.isSuccessful() && t.getResult() != null && t.getResult().isAuthenticated()));
    }

    @PluginMethod
    public void unlockAchievement(PluginCall call) {
        if (!ready(call)) return;
        String id = call.getString("id");
        if (id == null || id.isEmpty()) { call.reject("missing id"); return; }
        PlayGames.getAchievementsClient(getActivity()).unlock(id);
        call.resolve();
    }

    @PluginMethod
    public void showAchievements(PluginCall call) {
        if (!ready(call)) return;
        PlayGames.getAchievementsClient(getActivity()).getAchievementsIntent().addOnCompleteListener(t -> showIntent(call, t.isSuccessful() ? t.getResult() : null));
    }

    @PluginMethod
    public void submitScore(PluginCall call) {
        if (!ready(call)) return;
        String id = call.getString("id");
        Long score = call.getLong("score");
        if (id == null || id.isEmpty() || score == null) { call.reject("missing id or score"); return; }
        PlayGames.getLeaderboardsClient(getActivity()).submitScore(id, score);
        call.resolve();
    }

    @PluginMethod
    public void showLeaderboard(PluginCall call) {
        if (!ready(call)) return;
        String id = call.getString("id");
        if (id == null || id.isEmpty()) { call.reject("missing id"); return; }
        PlayGames.getLeaderboardsClient(getActivity()).getLeaderboardIntent(id).addOnCompleteListener(t -> showIntent(call, t.isSuccessful() ? t.getResult() : null));
    }

    @PluginMethod
    public void showAllLeaderboards(PluginCall call) {
        if (!ready(call)) return;
        PlayGames.getLeaderboardsClient(getActivity()).getAllLeaderboardsIntent().addOnCompleteListener(t -> showIntent(call, t.isSuccessful() ? t.getResult() : null));
    }

    private void showIntent(PluginCall call, Intent intent) {
        if (intent == null) { call.reject("Play Games screen unavailable"); return; }
        getActivity().startActivityForResult(intent, RC_UI);
        call.resolve();
    }

    // ---------------------------------------------------------------- Saved Games (cloud save)
    @PluginMethod
    public void saveGame(PluginCall call) {
        if (!ready(call)) return;
        String name = call.getString("name", "profile");
        String data = call.getString("data", "");
        String desc = call.getString("description", "Progress");
        SnapshotsClient client = PlayGames.getSnapshotsClient(getActivity());
        client.open(name, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED).addOnCompleteListener(t -> {
            if (!t.isSuccessful() || t.getResult() == null) { call.reject("open failed"); return; }
            SnapshotsClient.DataOrConflict<Snapshot> dc = t.getResult();
            Snapshot snap = dc.isConflict() ? dc.getConflict().getSnapshot() : dc.getData();
            if (snap == null) { call.reject("no snapshot"); return; }
            snap.getSnapshotContents().writeBytes(data.getBytes(StandardCharsets.UTF_8));
            SnapshotMetadataChange change = new SnapshotMetadataChange.Builder().setDescription(desc).build();
            client.commitAndClose(snap, change).addOnCompleteListener(c -> { if (c.isSuccessful()) call.resolve(); else call.reject("commit failed"); });
        });
    }

    @PluginMethod
    public void loadGame(PluginCall call) {
        if (!ready(call)) return;
        String name = call.getString("name", "profile");
        SnapshotsClient client = PlayGames.getSnapshotsClient(getActivity());
        client.open(name, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED).addOnCompleteListener(t -> {
            JSObject r = new JSObject();
            if (!t.isSuccessful() || t.getResult() == null) { call.resolve(r); return; }
            SnapshotsClient.DataOrConflict<Snapshot> dc = t.getResult();
            Snapshot snap = dc.isConflict() ? dc.getConflict().getSnapshot() : dc.getData();
            if (snap == null) { call.resolve(r); return; }
            try {
                byte[] bytes = snap.getSnapshotContents().readFully();
                if (bytes != null && bytes.length > 0) r.put("data", new String(bytes, StandardCharsets.UTF_8));
            } catch (Exception e) {
                // empty or unreadable save: treat as no cloud data
            }
            client.discardAndClose(snap);
            call.resolve(r);
        });
    }

    // ---------------------------------------------------------------- Play in-app review
    @PluginMethod
    public void requestReview(PluginCall call) {
        ReviewManager manager = ReviewManagerFactory.create(getContext());
        manager.requestReviewFlow().addOnCompleteListener(t -> {
            if (!t.isSuccessful()) { call.resolve(); return; }
            manager.launchReviewFlow(getActivity(), t.getResult()).addOnCompleteListener(x -> call.resolve());
        });
    }
}
