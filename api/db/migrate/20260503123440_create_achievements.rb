class CreateAchievements < ActiveRecord::Migration[8.1]
  def change
    create_table :achievements do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :kind, null: false
      t.string :source_type
      t.bigint :source_id
      t.datetime :earned_at, null: false
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    # Earn-once guarantee: a given (kind, source) pair can only unlock
    # once per user. Source can be nil for global achievements (like
    # first_plant); Postgres treats NULL as distinct so the unique
    # constraint still permits the global row plus per-source rows.
    add_index :achievements,
              [:user_id, :kind, :source_type, :source_id],
              unique: true,
              name: 'index_achievements_on_user_kind_source'

    add_index :achievements, [:source_type, :source_id]
    add_index :achievements, :earned_at
  end
end
