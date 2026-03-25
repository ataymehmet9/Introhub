import { Link } from '@tanstack/react-router'
import Container from '@/components/shared/Container'
import SpaceSignBoard from '@/assets/svg/SpaceSignBoard'
import { Button } from '@/components/ui'

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <Container className="h-full">
      <div className="h-full flex flex-col items-center justify-center">
        <SpaceSignBoard height={280} width={280} />
        <div className="mt-10 text-center">
          <h3 className="mb-2">Oh uh - We can't find this page!</h3>
          <p className="text-base">
            {children || 'The page you are looking for does not exist'}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center mt-6">
            <Button onClick={() => window.history.back()}>Go back</Button>
            <Button variant="solid" asElement={Link} to="/">
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
