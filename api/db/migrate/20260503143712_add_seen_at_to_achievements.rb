class AddSeenAtToAchievements < ActiveRecord::Migration[8.1]
  def change
    add_column :achievements, :seen_at, :datetime
    add_index :achievements, [:user_id, :seen_at]
  end
end
