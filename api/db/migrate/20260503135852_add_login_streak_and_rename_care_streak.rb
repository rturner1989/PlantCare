class AddLoginStreakAndRenameCareStreak < ActiveRecord::Migration[8.1]
  def change
    # Rename existing streak columns to make their semantics explicit —
    # they cache the *care-log* streak, distinct from the new *login*
    # streak we're adding alongside.
    rename_column :users, :current_streak_days, :current_care_streak_days
    rename_column :users, :longest_streak_days, :longest_care_streak_days

    add_column :users, :current_login_streak_days, :integer, null: false, default: 0
    add_column :users, :longest_login_streak_days, :integer, null: false, default: 0
    add_column :users, :last_login_on, :date

    # No backfill — login streak begins counting on first authenticated
    # request after deploy. Pre-launch userbase, no real history.
  end
end
