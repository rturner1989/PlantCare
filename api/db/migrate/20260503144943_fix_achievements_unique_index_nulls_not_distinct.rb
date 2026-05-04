class FixAchievementsUniqueIndexNullsNotDistinct < ActiveRecord::Migration[8.1]
  # Original unique index on (user_id, kind, source_type, source_id)
  # treated NULL as distinct (Postgres default), so multiple rows with
  # the same user+kind and a NULL source slipped past it. Postgres 15+
  # supports NULLS NOT DISTINCT which makes NULLs collide like real
  # values — the constraint we always wanted.
  def up
    execute(<<~SQL.squish)
      DELETE FROM achievements a USING achievements b
      WHERE a.id < b.id
        AND a.user_id = b.user_id
        AND a.kind = b.kind
        AND a.source_type IS NOT DISTINCT FROM b.source_type
        AND a.source_id IS NOT DISTINCT FROM b.source_id
    SQL

    remove_index :achievements, name: :index_achievements_on_user_kind_source
    add_index :achievements, [:user_id, :kind, :source_type, :source_id],
              unique: true, nulls_not_distinct: true,
              name: :index_achievements_on_user_kind_source
  end

  def down
    remove_index :achievements, name: :index_achievements_on_user_kind_source
    add_index :achievements, [:user_id, :kind, :source_type, :source_id],
              unique: true,
              name: :index_achievements_on_user_kind_source
  end
end
