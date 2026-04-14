# frozen_string_literal: true

module Api
  module V1
    module Plants
      class CareLogsController < PlantScopedController
        def index
          logs = @plant.care_logs.chronological
          logs = logs.where(care_type: params[:care_type]) if params[:care_type].present?

          render json: logs
        end

        def create
          log = @plant.care_logs.new(care_log_params)

          if log.save
            render json: log, status: :created
          else
            render json: { errors: log.errors.messages }, status: :unprocessable_content
          end
        end

        private def care_log_params
          params.expect(care_log: [:care_type, :performed_at, :notes])
        end
      end
    end
  end
end
