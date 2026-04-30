# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  config.logger.level = Logger::WARN if Rails.env.test?

  # Load cron schedule on server boot. Skipped in test so the daily
  # sweeper doesn't spin up during the test suite.
  unless Rails.env.test?
    schedule_path = Rails.root.join('config/schedule.yml')
    Sidekiq::Cron::Job.load_from_hash(YAML.load_file(schedule_path)) if schedule_path.exist?
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  config.logger.level = Logger::WARN if Rails.env.test?
end
