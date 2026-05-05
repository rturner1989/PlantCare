# frozen_string_literal: true

module Api
  module V1
    class DashboardController < BaseController
      WEEK_DAYS = 7

      def show
        plants = current_user.plants.includes(:species, :space)

        render json: {
          plants_needing_water: plants.select { |p| p.water_status.in?([:overdue, :due_today]) },
          plants_needing_feeding: plants.select { |p| p.feed_status.in?([:overdue, :due_today]) },
          upcoming_care: plants.select { |p| p.water_status == :due_soon || p.feed_status == :due_soon },
          tasks: current_user.tasks_on(selected_date),
          tasks_by_day: tasks_by_day_for_week(plants),
          streak: {
            current: current_user.effective_current_login_streak_days,
            longest: current_user.longest_login_streak_days,
            care_current: current_user.effective_current_care_streak_days,
            care_longest: current_user.longest_care_streak_days
          },
          stats: {
            total_plants: plants.size,
            total_spaces: current_user.spaces.count,
            vitality_percent: current_user.vitality_percent
          }
        }
      end

      # Date param drives the rituals list — Today defaults to today,
      # WeekCalendar can pass any date in the visible week.
      private def selected_date
        return Date.current if params[:date].blank?

        Date.parse(params[:date])
      rescue ArgumentError
        Date.current
      end

      # Per-day water/feed counts for the calendar dot row. A plant
      # contributes to today's dots when its next-due date is on or
      # before today (overdue + due-today bucketed onto today). For
      # future days only the exact next-due date counts — calendar
      # answers "what's scheduled on Wednesday", not "what's still
      # outstanding by Wednesday".
      private def tasks_by_day_for_week(plants)
        WEEK_DAYS.times.with_object({}) do |offset, hash|
          date = Date.current + offset.days
          counts = { water: 0, feed: 0 }
          plants.each do |plant|
            counts[:water] += 1 if water_falls_on?(plant, date)
            counts[:feed] += 1 if feed_falls_on?(plant, date)
          end
          hash[date.to_s] = counts
        end
      end

      # Cumulative — once a task is past its next_*_on date, it stays
      # in the dot count for every subsequent day until completed. Same
      # logic as Plant#tasks_on so the calendar dots match the ritual
      # list count for that day exactly.
      private def water_falls_on?(plant, date)
        plant.next_water_on && plant.next_water_on <= date
      end

      private def feed_falls_on?(plant, date)
        plant.next_feed_on && plant.next_feed_on <= date
      end
    end
  end
end
